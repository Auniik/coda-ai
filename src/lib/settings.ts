import { readFileSync, existsSync } from 'fs';
import yaml from 'js-yaml';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface Settings {
  docs: string[];
  commands: string[];
  operations?: Record<string, string[]>;
}

export function loadSettings(path: string): Settings {
  if (!existsSync(path)) {
    throw new Error('Settings file not found: ' + path);
  }

  const content = readFileSync(path, 'utf8');
  const settings = yaml.load(content) as Settings;

  return settings;
}

export function isCommandAllowed(command: string, settings: Settings): boolean {
  if (settings.commands.includes('all')) {
    return true;
  }
  return settings.commands.includes(command);
}

export function isDocAllowed(docId: string, settings: Settings): boolean {
  if (settings.docs.includes('all')) {
    return true;
  }
  return settings.docs.includes(docId);
}

export function isOperationAllowed(
  resource: string,
  operation: string,
  settings: Settings
): boolean {
  if (!settings.operations) {
    return true;
  }

  const allowedOperations = settings.operations[resource];
  if (!allowedOperations) {
    return true;
  }

  return allowedOperations.includes(operation);
}

export function getDefaultSettingsPath(): string {
  const cwd = process.cwd();
  const cwdSettings = join(cwd, 'settings.yaml');
  
  if (existsSync(cwdSettings)) {
    return cwdSettings;
  }
  
  const packageSettings = join(dirname(__dirname), '..', 'settings.yaml');
  
  if (existsSync(packageSettings)) {
    return packageSettings;
  }
  
  const homeSettings = join(process.env.HOME || process.env.USERPROFILE || '', '.coda-ai', 'settings.yaml');
  
  if (existsSync(homeSettings)) {
    return homeSettings;
  }
  
  return cwdSettings;
}
