import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Fuse from 'fuse.js';
import { encode as toonEncode } from '@toon-format/toon';
import { getCredentials } from '../lib/auth-storage.js';
import { CodaClient } from '../lib/coda-client.js';
import { loadSettings, getDefaultSettingsPath, isCommandAllowed } from '../lib/settings.js';
import { formatJson } from '../lib/formatters.js';
import { DocIdSchema } from '../lib/validation.js';

interface PageHierarchy {
  name: string;
  pageId: string;
  child?: PageHierarchy[];
}

interface DocHierarchy {
  name: string;
  docId: string;
  pages: PageHierarchy[];
}

function buildPageHierarchy(pages: any[]): PageHierarchy[] {
  const pageMap = new Map<string, PageHierarchy>();
  const rootPages: PageHierarchy[] = [];

  pages.forEach((page: any) => {
    pageMap.set(page.id, {
      name: page.name,
      pageId: page.id,
    });
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

function formatTree(docs: DocHierarchy[]): string {
  const lines: string[] = [];
  
  docs.forEach((doc, docIndex) => {
    const isLastDoc = docIndex === docs.length - 1;
    const docPrefix = isLastDoc ? '└── ' : '├── ';
    const childPrefix = isLastDoc ? '    ' : '│   ';
    
    lines.push(`${docPrefix}${chalk.bold(doc.name)} ${chalk.dim(`(${doc.docId})`)}`);
    
    if (doc.pages.length > 0) {
      formatPages(doc.pages, childPrefix, lines);
    }
  });
  
  return lines.join('\n');
}

function formatPages(pages: PageHierarchy[], prefix: string, lines: string[]): void {
  pages.forEach((page, index) => {
    const isLast = index === pages.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    
    lines.push(`${prefix}${connector}${page.name} ${chalk.dim(`(${page.pageId})`)}`);
    
    if (page.child && page.child.length > 0) {
      formatPages(page.child, childPrefix, lines);
    }
  });
}

async function inspectSingleDoc(client: CodaClient, docId: string, spinner: any): Promise<DocHierarchy> {
  spinner.text = `Fetching doc ${docId}...`;
  const doc: any = await client.get(`/docs/${docId}`);
  
  spinner.text = 'Fetching pages...';
  const pages: any[] = [];
  for await (const page of client.paginate(`/docs/${docId}/pages`)) {
    pages.push(page);
  }

  const pageHierarchy = buildPageHierarchy(pages);

  return {
    name: doc.name,
    docId: doc.id,
    pages: pageHierarchy,
  };
}

async function inspectAllDocs(client: CodaClient, spinner: any): Promise<DocHierarchy[]> {
  spinner.text = 'Fetching all docs...';
  const docsResponse: any = await client.get('/docs');
  const docs = docsResponse.items || [];

  const results: DocHierarchy[] = [];

  for (const doc of docs) {
    spinner.text = `Fetching pages for ${doc.name}...`;
    const pages: any[] = [];
    for await (const page of client.paginate(`/docs/${doc.id}/pages`)) {
      pages.push(page);
    }
    
    const pageHierarchy = buildPageHierarchy(pages);

    results.push({
      name: doc.name,
      docId: doc.id,
      pages: pageHierarchy,
    });
  }

  return results;
}

export function findCommand(program: Command): void {
  program
    .command('find')
    .description('Find docs and pages with hierarchical navigation')
    .option('--format <type>', 'Output format: json, tree, or toon', 'json')
    .option('--doc <query>', 'Fuzzy search docs by name or exact docId')
    .option('--page <query>', 'Fuzzy search pages by name')
    .action(async (options?: { format?: string; doc?: string; page?: string }) => {
      try {
        const settings = loadSettings(getDefaultSettingsPath());
        
        if (!isCommandAllowed('find', settings)) {
          console.error(chalk.red('Error: find command is not allowed by settings'));
          process.exit(1);
        }

        const apiToken = await getCredentials();
        
        if (!apiToken) {
          console.error(chalk.red('Error: Not authenticated. Run "coda-ai auth" first.'));
          process.exit(1);
        }

        const spinner = ora('Starting search...').start();
        const client = new CodaClient(apiToken);

        try {
          const format = options?.format || 'json';
          const docQuery = options?.doc;
          const pageQuery = options?.page;
          
          if (format !== 'json' && format !== 'tree' && format !== 'toon') {
            spinner.fail('Invalid format');
            console.error(chalk.red('Error: format must be "json", "tree", or "toon"'));
            process.exit(1);
          }
          
          let docId: string | undefined;
          
          if (docQuery) {
            const isDocId = /^[a-zA-Z0-9_-]{10,}$/.test(docQuery);
            
            if (isDocId) {
              const validationResult = DocIdSchema.safeParse(docQuery);
              if (!validationResult.success) {
                spinner.fail('Invalid docId');
                console.error(chalk.red('Error:'), validationResult.error.errors[0].message);
                process.exit(1);
              }
              docId = docQuery;
            } else {
              spinner.text = 'Fuzzy searching docs...';
            }
          }
          
          let result;
          
          if (docId) {
            result = [await inspectSingleDoc(client, docId, spinner)];
          } else {
            result = await inspectAllDocs(client, spinner);
            
            if (docQuery && !docId) {
              const fuse = new Fuse(result, {
                keys: ['name'],
                threshold: 0.4,
              });
              const searchResults = fuse.search(docQuery);
              result = searchResults.map(r => r.item);
              
              if (result.length === 0) {
                spinner.warn(`No docs found matching "${docQuery}"`);
                process.exit(0);
              }
            }
          }
          
          if (pageQuery) {
            const filterPages = (pages: PageHierarchy[]): PageHierarchy[] => {
              const filtered: PageHierarchy[] = [];
              
              for (const page of pages) {
                const fuse = new Fuse([page], {
                  keys: ['name'],
                  threshold: 0.4,
                });
                const matches = fuse.search(pageQuery);
                
                if (matches.length > 0) {
                  filtered.push(page);
                } else if (page.child && page.child.length > 0) {
                  const filteredChildren = filterPages(page.child);
                  if (filteredChildren.length > 0) {
                    filtered.push({
                      ...page,
                      child: filteredChildren,
                    });
                  }
                }
              }
              
              return filtered;
            };
            
            result = result.map(doc => ({
              ...doc,
              pages: filterPages(doc.pages),
            })).filter(doc => doc.pages.length > 0);
            
            if (result.length === 0) {
              spinner.warn(`No pages found matching "${pageQuery}"`);
              process.exit(0);
            }
          }

          spinner.succeed('Doc inspection complete');
          
          if (format === 'tree') {
            console.log(formatTree(result));
          } else if (format === 'toon') {
            console.log(toonEncode(result));
          } else {
            console.log(formatJson(result));
          }
        } catch (error: any) {
          spinner.fail('Inspection failed');
          throw error;
        }
      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });
}
