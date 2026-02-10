import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { encode as toonEncode } from '@toon-format/toon';
import { getCredentials } from '../lib/auth-storage.js';
import { CodaClient } from '../lib/coda-client.js';
import { loadSettings, getDefaultSettingsPath, isCommandAllowed } from '../lib/settings.js';
import { formatJson } from '../lib/formatters.js';
import { DocIdSchema } from '../lib/validation.js';

interface PageHierarchy {
  pageId: string;
  name: string;
  child?: PageHierarchy[];
}

interface PageFull extends PageHierarchy {
  id: string;
  type: string;
  href: string;
  browserLink: string;
  parent?: {
    id: string;
    type: string;
    href: string;
    browserLink: string;
  };
  children?: string[];
  createdAt?: string;
  updatedAt?: string;
  contentType?: string;
  subtitle?: string;
  icon?: {
    name: string;
    type: string;
    browserLink: string;
  };
  image?: {
    browserLink: string;
    type: string;
    width?: number;
    height?: number;
  };
}

function buildPageHierarchy(pages: any[], compact: boolean): PageHierarchy[] | PageFull[] {
  const pageMap = new Map<string, any>();
  const rootPages: any[] = [];

  pages.forEach((page: any) => {
    const pageNode: any = compact
      ? {
          pageId: page.id,
          name: page.name,
        }
      : {
          id: page.id,
          type: page.type,
          href: page.href,
          browserLink: page.browserLink,
          pageId: page.id,
          name: page.name,
          parent: page.parent,
          children: page.children,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
          contentType: page.contentType,
          subtitle: page.subtitle,
          icon: page.icon,
          image: page.image,
        };
    
    pageMap.set(page.id, pageNode);
  });

  pages.forEach((page: any) => {
    const pageNode = pageMap.get(page.id)!;
    
    if (page.parent && page.parent.type === 'page') {
      const parentNode = pageMap.get(page.parent.id);
      if (parentNode) {
        if (!parentNode.child) {
          parentNode.child = [];
        }
        parentNode.child.push(pageNode);
      } else {
        rootPages.push(pageNode);
      }
    } else {
      rootPages.push(pageNode);
    }
  });

  return rootPages;
}

function formatTree(pages: any[], prefix = '', compact: boolean = false): string {
  const lines: string[] = [];
  
  pages.forEach((page, index) => {
    const isLast = index === pages.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    
    const pageDisplay = compact
      ? `${page.name} ${chalk.dim(`(${page.pageId})`)}`
      : `${page.name} ${chalk.dim(`(${page.pageId})`)}`;
    
    lines.push(`${prefix}${connector}${pageDisplay}`);
    
    if (page.child && page.child.length > 0) {
      lines.push(formatTree(page.child, childPrefix, compact));
    }
  });
  
  return lines.join('\n');
}

export function pagesCommand(program: Command): void {
  program
    .command('pages')
    .description('List pages in a Coda document')
    .requiredOption('--docId <docId>', 'Document ID')
    .option('--format <type>', 'Output format: toon, json, or tree', 'toon')
    .option('--compact', 'Show only pageId and name')
    .action(async (options: { docId: string; format?: string; compact?: boolean }) => {
      try {
        const settings = loadSettings(getDefaultSettingsPath());
        
        if (!isCommandAllowed('pages', settings)) {
          console.error(chalk.red('Error: pages command is not allowed by settings'));
          process.exit(1);
        }

        const validationResult = DocIdSchema.safeParse(options.docId);
        if (!validationResult.success) {
          console.error(chalk.red('Error:'), validationResult.error.errors[0].message);
          process.exit(1);
        }

        const apiToken = await getCredentials();
        
        if (!apiToken) {
          console.error(chalk.red('Error: Not authenticated. Run "coda-ai auth" first.'));
          process.exit(1);
        }

        const spinner = ora('Fetching pages...').start();
        const client = new CodaClient(apiToken);

        try {
          const format = options?.format || 'toon';
          const compact = options?.compact || false;
          
          if (format !== 'json' && format !== 'tree' && format !== 'toon') {
            spinner.fail('Invalid format');
            console.error(chalk.red('Error: format must be "toon", "json", or "tree"'));
            process.exit(1);
          }

          const pages: any[] = [];
          for await (const page of client.paginate(`/docs/${options.docId}/pages`)) {
            pages.push(page);
          }

          spinner.succeed(`Found ${pages.length} page${pages.length === 1 ? '' : 's'}`);

          if (pages.length === 0) {
            console.log(chalk.dim('No pages found'));
            return;
          }

          const hierarchy = buildPageHierarchy(pages, compact);

          if (format === 'tree') {
            console.log(formatTree(hierarchy, '', compact));
          } else if (format === 'toon') {
            console.log(toonEncode(hierarchy));
          } else {
            console.log(formatJson(hierarchy));
          }
        } catch (error: any) {
          spinner.fail('Failed to fetch pages');
          throw error;
        }
      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });
}
