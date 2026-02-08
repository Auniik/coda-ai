import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.coda-ai');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

interface Config {
  apiToken?: string;
}

function loadConfig(): Config {
  if (!fs.existsSync(CONFIG_FILE)) {
    return {};
  }

  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function saveConfig(config: Config): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), {
    mode: 0o600,
  });
}

export async function saveCredentials(apiToken: string): Promise<void> {
  try {
    const config = loadConfig();
    config.apiToken = apiToken;
    saveConfig(config);
  } catch (error) {
    throw new Error('Failed to save credentials: ' + (error as Error).message);
  }
}

export async function getCredentials(): Promise<string | null> {
  try {
    const config = loadConfig();
    return config.apiToken || null;
  } catch (error) {
    throw new Error('Failed to retrieve credentials: ' + (error as Error).message);
  }
}

export async function hasCredentials(): Promise<boolean> {
  const token = await getCredentials();
  return token !== null;
}

export async function deleteCredentials(): Promise<void> {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
  } catch (error) {
    throw new Error('Failed to delete credentials: ' + (error as Error).message);
  }
}

