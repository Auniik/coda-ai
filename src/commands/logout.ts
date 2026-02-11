import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { deleteCredentials } from '../lib/auth-storage.js';

const CONFIG_FILE = path.join(os.homedir(), '.coda-ai', 'config.json');

export function logoutCommand(program: Command): void {
  program
    .command('logout')
    .description('Remove locally stored Coda API credentials')
    .action(async () => {
      try {
        const existed = fs.existsSync(CONFIG_FILE);
        await deleteCredentials();

        if (existed) {
          console.log(chalk.green('Logged out. Credentials removed from ') + chalk.cyan(CONFIG_FILE));
        } else {
          console.log(chalk.yellow('No stored credentials found. Nothing to do.'));
        }
      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });
}
