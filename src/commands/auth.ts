import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { config } from 'dotenv';
import { saveCredentials, getCredentials } from '../lib/auth-storage.js';
import { CodaClient } from '../lib/coda-client.js';
import { ApiTokenSchema } from '../lib/validation.js';

export function authCommand(program: Command): void {
  program
    .command('auth')
    .description('Configure Coda API authentication')
    .option('--from-file <path>', 'Load credentials from .env file')
    .action(async (options) => {
      try {
        let apiToken: string;

        if (options.fromFile) {
          config({ path: options.fromFile });
          apiToken = process.env.CODA_API_TOKEN || '';
          
          if (!apiToken) {
            console.error(chalk.red('Error: CODA_API_TOKEN not found in file'));
            process.exit(1);
          }
        } else {
          const existing = await getCredentials();
          
          const answers = await inquirer.prompt([
            {
              type: 'password',
              name: 'apiToken',
              message: 'Enter your Coda API token:',
              default: existing || undefined,
              validate: (input: string) => {
                const result = ApiTokenSchema.safeParse(input);
                return result.success || result.error.errors[0].message;
              },
            },
          ]);

          apiToken = answers.apiToken;
        }

        const spinner = ora('Validating token...').start();

        try {
          const client = new CodaClient(apiToken);
          await client.get('/whoami');
          
          await saveCredentials(apiToken);
          
          spinner.succeed(chalk.green('Authentication successful!'));
        } catch (error: any) {
          spinner.fail(chalk.red('Authentication failed'));
          console.error(chalk.red(error.message));
          process.exit(1);
        }
      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });
}
