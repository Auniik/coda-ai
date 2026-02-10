import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readCommand } from '../../../src/commands/read.js';
import { Command } from 'commander';

vi.mock('../../../src/lib/auth-storage.js', () => ({
  getCredentials: vi.fn().mockResolvedValue('test-token'),
}));

vi.mock('../../../src/lib/settings.js', () => ({
  loadSettings: vi.fn().mockReturnValue({ docs: ['all'], commands: ['read'] }),
  getDefaultSettingsPath: vi.fn().mockReturnValue('/mock/settings.yaml'),
  isCommandAllowed: vi.fn().mockReturnValue(true),
  isDocAllowed: vi.fn().mockReturnValue(true),
}));

vi.mock('../../../src/lib/coda-client.js', () => ({
  CodaClient: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue({
      id: 'page1',
      name: 'Test Page',
      type: 'page',
    }),
    exportPageContent: vi.fn().mockResolvedValue('# Test Content'),
  })),
}));

describe('read command', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    vi.clearAllMocks();
  });

  it('should register read command', () => {
    readCommand(program);
    const readCmd = program.commands.find(cmd => cmd.name() === 'read');
    expect(readCmd).toBeDefined();
    expect(readCmd?.description()).toBe('Read page content with all resources');
  });

  it('should require docId option', () => {
    readCommand(program);
    const readCmd = program.commands.find(cmd => cmd.name() === 'read');
    const docIdOption = readCmd?.options.find(opt => opt.long === '--docId');
    expect(docIdOption).toBeDefined();
    expect(docIdOption?.required).toBe(true);
  });

  it('should require pageId option', () => {
    readCommand(program);
    const readCmd = program.commands.find(cmd => cmd.name() === 'read');
    const pageIdOption = readCmd?.options.find(opt => opt.long === '--pageId');
    expect(pageIdOption).toBeDefined();
    expect(pageIdOption?.required).toBe(true);
  });

  it('should have format option with markdown default', () => {
    readCommand(program);
    const readCmd = program.commands.find(cmd => cmd.name() === 'read');
    const formatOption = readCmd?.options.find(opt => opt.long === '--format');
    expect(formatOption).toBeDefined();
    expect(formatOption?.defaultValue).toBe('markdown');
  });
});
