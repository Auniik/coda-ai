import { Command } from 'commander';
import chalk from 'chalk';
import { getCredentials } from '../lib/auth-storage.js';
import { CodaClient } from '../lib/coda-client.js';
import { loadSettings, getDefaultSettingsPath, isCommandAllowed } from '../lib/settings.js';
import { formatJson } from '../lib/formatters.js';

export function whoamiCommand(program: Command): void {
  program
    .command('whoami')
    .description('Get current user info')
    .action(async () => {
      try {
        const settings = loadSettings(getDefaultSettingsPath());
        
        if (!isCommandAllowed('whoami', settings)) {
          console.error(chalk.red('Error: whoami command is not allowed by settings'));
          process.exit(1);
        }

        const apiToken = await getCredentials();
        
        if (!apiToken) {
          console.error(chalk.red('Error: Not authenticated. Run "coda-ai auth" first.'));
          process.exit(1);
        }

        const client = new CodaClient(apiToken);
        const user = await client.get('/whoami');

        console.log(formatJson(user));
      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });
}
