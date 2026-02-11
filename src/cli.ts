#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { getVersion } from './lib/utils.js';
import { authCommand } from './commands/auth.js';
import { whoamiCommand } from './commands/whoami.js';
import { docsCommand } from './commands/docs.js';
import { pagesCommand } from './commands/pages.js';
import { readCommand } from './commands/read.js';
import { logoutCommand } from './commands/logout.js';

const program = new Command();

program
  .name('coda-ai')
  .description('AI-friendly CLI for Coda.io reader')
  .version(getVersion());

authCommand(program);
whoamiCommand(program);
docsCommand(program);
pagesCommand(program);
readCommand(program);
logoutCommand(program);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
