import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pagesCommand } from '../../../src/commands/pages.js';
import { Command } from 'commander';

vi.mock('../../../src/lib/auth-storage.js', () => ({
  getCredentials: vi.fn().mockResolvedValue('test-token'),
}));

vi.mock('../../../src/lib/settings.js', () => ({
  loadSettings: vi.fn().mockReturnValue({ docs: ['all'], commands: ['pages'] }),
  getDefaultSettingsPath: vi.fn().mockReturnValue('/mock/settings.yaml'),
  isCommandAllowed: vi.fn().mockReturnValue(true),
}));

vi.mock('../../../src/lib/coda-client.js', () => ({
  CodaClient: vi.fn().mockImplementation(() => ({
    paginate: vi.fn().mockImplementation(async function* () {
      yield {
        id: 'page1',
        type: 'page',
        href: 'https://coda.io/apis/v1/docs/doc1/pages/page1',
        browserLink: 'https://coda.io/d/_ddoc1#page1',
        name: 'Test Page',
        parent: null,
      };
    }),
  })),
}));

describe('pages command', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    vi.clearAllMocks();
  });

  it('should register pages command', () => {
    pagesCommand(program);
    const pagesCmd = program.commands.find(cmd => cmd.name() === 'pages');
    expect(pagesCmd).toBeDefined();
    expect(pagesCmd?.description()).toBe('List pages in a Coda document');
  });

  it('should require docId option', () => {
    pagesCommand(program);
    const pagesCmd = program.commands.find(cmd => cmd.name() === 'pages');
    const docIdOption = pagesCmd?.options.find(opt => opt.long === '--docId');
    expect(docIdOption).toBeDefined();
    expect(docIdOption?.required).toBe(true);
  });

  it('should have format option', () => {
    pagesCommand(program);
    const pagesCmd = program.commands.find(cmd => cmd.name() === 'pages');
    const formatOption = pagesCmd?.options.find(opt => opt.long === '--format');
    expect(formatOption).toBeDefined();
    expect(formatOption?.defaultValue).toBe('toon');
  });

  it('should have compact option', () => {
    pagesCommand(program);
    const pagesCmd = program.commands.find(cmd => cmd.name() === 'pages');
    const compactOption = pagesCmd?.options.find(opt => opt.long === '--compact');
    expect(compactOption).toBeDefined();
  });
});
