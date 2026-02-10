import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import ora from 'ora';
import { encode as toonEncode } from '@toon-format/toon';
import { getCredentials } from '../lib/auth-storage.js';
import { CodaClient } from '../lib/coda-client.js';
import { loadSettings, getDefaultSettingsPath, isCommandAllowed } from '../lib/settings.js';
import { formatJson } from '../lib/formatters.js';

interface DocListItem {
  id: string;
  type: string;
  href: string;
  browserLink: string;
  name: string;
  owner: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
  workspace?: {
    id: string;
    type: string;
    browserLink: string;
    organizationId?: string;
    name: string;
  };
  folder?: {
    id: string;
    type: string;
    browserLink: string;
    name: string;
  };
  workspaceId?: string;
  folderId?: string;
  icon?: {
    name: string;
    type: string;
    browserLink: string;
  };
  docSize?: {
    totalRowCount: number;
    tableAndViewCount: number;
    pageCount: number;
    overApiSizeLimit: boolean;
  };
  sourceDoc?: {
    id: string;
    type: string;
    browserLink: string;
    href: string;
  };
  published?: {
    browserLink: string;
    discoverable: boolean;
    earnCredit: boolean;
    mode: string;
    categories?: Array<{ name: string }>;
    description?: string;
    imageLink?: string;
  };
}

export function docsCommand(program: Command): void {
  program
    .command('docs')
    .description('List all accessible Coda documents')
    .option('--format <type>', 'Output format: toon, json, or table', 'toon')
    .option('--compact', 'Show only docId and name (toon/json only)')
    .action(async (options?: { format?: string; compact?: boolean }) => {
      try {
        const settings = loadSettings(getDefaultSettingsPath());
        
        if (!isCommandAllowed('docs', settings)) {
          console.error(chalk.red('Error: docs command is not allowed by settings'));
          process.exit(1);
        }

        const apiToken = await getCredentials();
        
        if (!apiToken) {
          console.error(chalk.red('Error: Not authenticated. Run "coda-ai auth" first.'));
          process.exit(1);
        }

        const spinner = ora('Fetching documents...').start();
        const client = new CodaClient(apiToken);

        try {
          const format = options?.format || 'toon';
          
          if (format !== 'json' && format !== 'table' && format !== 'toon') {
            spinner.fail('Invalid format');
            console.error(chalk.red('Error: format must be "toon", "json", or "table"'));
            process.exit(1);
          }

          const docsResponse: any = await client.get('/docs');
          let docs: DocListItem[] = (docsResponse.items || []).map((doc: any) => ({
            id: doc.id,
            type: doc.type,
            href: doc.href,
            browserLink: doc.browserLink,
            name: doc.name,
            owner: doc.owner,
            ownerName: doc.ownerName,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            workspace: doc.workspace,
            folder: doc.folder,
            workspaceId: doc.workspaceId,
            folderId: doc.folderId,
            icon: doc.icon,
            docSize: doc.docSize,
            sourceDoc: doc.sourceDoc,
            published: doc.published,
          }));

          docs = docs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

          spinner.succeed(`Found ${docs.length} document${docs.length === 1 ? '' : 's'}`);

          let output: any = docs;

          if (options?.compact) {
            output = docs.map(doc => ({
              docId: doc.id,
              name: doc.name,
            }));
          }

          if (format === 'toon') {
            console.log(toonEncode(output));
          } else if (format === 'table') {
            if (docs.length === 0) {
              console.log(chalk.dim('No documents found'));
              return;
            }

            const table = new Table({
              head: [
                chalk.bold('id'),
                chalk.bold('name'),
                chalk.bold('owner'),
                chalk.bold('workspace'),
                chalk.bold('updated'),
              ],
              colWidths: [20, 30, 20, 20, 20],
              wordWrap: true,
            });

            docs.forEach(doc => {
              const updatedDate = new Date(doc.updatedAt).toLocaleDateString();
              table.push([
                doc.id,
                doc.name,
                doc.ownerName || doc.owner,
                doc.workspace?.name || '-',
                updatedDate,
              ]);
            });

            console.log(table.toString());
          } else {
            console.log(formatJson(output));
          }
        } catch (error: any) {
          spinner.fail('Failed to fetch documents');
          throw error;
        }
      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });
}
