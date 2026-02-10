import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getCredentials } from '../lib/auth-storage.js';
import { CodaClient } from '../lib/coda-client.js';
import { loadSettings, getDefaultSettingsPath, isCommandAllowed, isDocAllowed } from '../lib/settings.js';
import { formatJson } from '../lib/formatters.js';
import { DocIdSchema, PageIdSchema } from '../lib/validation.js';

export function readCommand(program: Command): void {
  program
    .command('read')
    .description('Read page content with all resources')
    .requiredOption('--docId <docId>', 'Document ID')
    .requiredOption('--pageId <pageId>', 'Page ID')
    .option('--format <type>', 'Output format: markdown, json, or html', 'markdown')
    .action(async (options: { docId: string; pageId: string; format?: string }) => {
      try {
        const docValidation = DocIdSchema.safeParse(options.docId);
        if (!docValidation.success) {
          console.error(chalk.red('Error:'), docValidation.error.errors[0].message);
          process.exit(1);
        }

        const pageValidation = PageIdSchema.safeParse(options.pageId);
        if (!pageValidation.success) {
          console.error(chalk.red('Error:'), pageValidation.error.errors[0].message);
          process.exit(1);
        }

        const settings = loadSettings(getDefaultSettingsPath());
        
        if (!isCommandAllowed('read', settings)) {
          console.error(chalk.red('Error: read command is not allowed by settings'));
          process.exit(1);
        }

        if (!isDocAllowed(options.docId, settings)) {
          console.error(chalk.red(`Error: Access to doc ${options.docId} is not allowed by settings`));
          process.exit(1);
        }

        const apiToken = await getCredentials();
        
        if (!apiToken) {
          console.error(chalk.red('Error: Not authenticated. Run "coda-ai auth" first.'));
          process.exit(1);
        }

        const spinner = ora('Reading page...').start();
        const client = new CodaClient(apiToken);

        try {
          const format = options.format || 'markdown';
          
          if (format !== 'json' && format !== 'markdown' && format !== 'html') {
            spinner.fail('Invalid format');
            console.error(chalk.red('Error: format must be "markdown", "json", or "html"'));
            process.exit(1);
          }
          
          if (format === 'markdown' || format === 'html') {
            spinner.text = `Exporting page as ${format}...`;
            const content = await client.exportPageContent(options.docId, options.pageId, format);
            spinner.succeed('Page export complete');
            console.log(content);
            return;
          }
          
          spinner.text = 'Fetching page metadata...';
          const page: any = await client.get(`/docs/${options.docId}/pages/${options.pageId}`);
          
          spinner.text = 'Fetching tables...';
          const tablesResponse: any = await client.get(`/docs/${options.docId}/tables`);
          const allTables = tablesResponse.items || [];
          const pageTables = allTables.filter((t: any) => t.parent?.id === options.pageId);

          const tablesWithDetails = [];
          for (const table of pageTables) {
            spinner.text = `Fetching columns for ${table.name}...`;
            const columnsResponse: any = await client.get(`/docs/${options.docId}/tables/${table.id}/columns`);
            const columns = columnsResponse.items || [];

            spinner.text = `Fetching sample rows for ${table.name}...`;
            const rowsResponse: any = await client.get(`/docs/${options.docId}/tables/${table.id}/rows`, {
              limit: 5,
            });
            const rows = rowsResponse.items || [];

            tablesWithDetails.push({
              id: table.id,
              name: table.name,
              type: table.type,
              rowCount: table.rowCount,
              columns: columns.map((c: any) => ({
                id: c.id,
                name: c.name,
                format: c.format,
              })),
              sampleRows: rows.map((r: any) => ({
                id: r.id,
                values: r.values,
              })),
            });
          }

          spinner.text = 'Fetching formulas...';
          const formulasResponse: any = await client.get(`/docs/${options.docId}/formulas`);
          const allFormulas = formulasResponse.items || [];
          const pageFormulas = allFormulas.filter((f: any) => f.parent?.id === options.pageId);

          spinner.text = 'Fetching controls...';
          const controlsResponse: any = await client.get(`/docs/${options.docId}/controls`);
          const allControls = controlsResponse.items || [];
          const pageControls = allControls.filter((c: any) => c.parent?.id === options.pageId);

          spinner.text = 'Exporting full content...';
          let content: string | null = null;
          try {
            content = await client.exportPageContent(options.docId, options.pageId, 'markdown');
          } catch (error) {
            content = null;
          }

          const result = {
            page: {
              id: page.id,
              name: page.name,
              type: page.type,
            },
            tables: tablesWithDetails,
            formulas: pageFormulas.map((f: any) => ({
              id: f.id,
              name: f.name,
              value: f.value,
            })),
            controls: pageControls.map((c: any) => ({
              id: c.id,
              name: c.name,
              type: c.type,
              value: c.value,
            })),
            content,
          };

          spinner.succeed('Page inspection complete');
          console.log(formatJson(result));
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
