import { describe, it, expect, vi, beforeEach } from 'vitest';
import { docsCommand } from '../../../src/commands/docs.js';
import { Command } from 'commander';

vi.mock('../../../src/lib/auth-storage.js', () => ({
  getCredentials: vi.fn().mockResolvedValue('test-token'),
}));

vi.mock('../../../src/lib/settings.js', () => ({
  loadSettings: vi.fn().mockReturnValue({ docs: ['all'], commands: ['docs'] }),
  getDefaultSettingsPath: vi.fn().mockReturnValue('/mock/settings.yaml'),
  isCommandAllowed: vi.fn().mockReturnValue(true),
}));

vi.mock('../../../src/lib/coda-client.js', () => ({
  CodaClient: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue({
      items: [
        {
          id: 'doc1',
          type: 'doc',
          href: 'https://coda.io/apis/v1/docs/doc1',
          browserLink: 'https://coda.io/d/_ddoc1',
          name: 'Test Doc',
          owner: 'test@example.com',
          ownerName: 'Test User',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
          workspace: { id: 'ws1', name: 'Test Workspace' },
        },
      ],
    }),
  })),
}));

describe('docs command', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    vi.clearAllMocks();
  });

  it('should register docs command', () => {
    docsCommand(program);
    const docsCmd = program.commands.find(cmd => cmd.name() === 'docs');
    expect(docsCmd).toBeDefined();
    expect(docsCmd?.description()).toBe('List all accessible Coda documents');
  });

  it('should have format option', () => {
    docsCommand(program);
    const docsCmd = program.commands.find(cmd => cmd.name() === 'docs');
    const formatOption = docsCmd?.options.find(opt => opt.long === '--format');
    expect(formatOption).toBeDefined();
    expect(formatOption?.defaultValue).toBe('toon');
  });

  it('should have compact option', () => {
    docsCommand(program);
    const docsCmd = program.commands.find(cmd => cmd.name() === 'docs');
    const compactOption = docsCmd?.options.find(opt => opt.long === '--compact');
    expect(compactOption).toBeDefined();
  });
});
