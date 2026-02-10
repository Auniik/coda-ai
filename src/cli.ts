#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { getVersion } from './lib/utils.js';
import { authCommand } from './commands/auth.js';
import { whoamiCommand } from './commands/whoami.js';
import { docsCommand } from './commands/docs.js';
import { findCommand } from './commands/find.js';
import { readCommand } from './commands/read.js';

const program = new Command();

program
  .name('coda-ai')
  .description('AI-friendly CLI for Coda.io reader')
  .version(getVersion());

authCommand(program);
whoamiCommand(program);
docsCommand(program);
findCommand(program);
readCommand(program);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
