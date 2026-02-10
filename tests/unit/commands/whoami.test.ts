import { describe, it, expect, vi, beforeEach } from 'vitest';
import { whoamiCommand } from '../../../src/commands/whoami.js';
import { Command } from 'commander';

vi.mock('../../../src/lib/auth-storage.js', () => ({
  getCredentials: vi.fn().mockResolvedValue('test-token'),
}));

vi.mock('../../../src/lib/settings.js', () => ({
  loadSettings: vi.fn().mockReturnValue({ commands: ['whoami'] }),
  getDefaultSettingsPath: vi.fn().mockReturnValue('/mock/settings.yaml'),
  isCommandAllowed: vi.fn().mockReturnValue(true),
}));

vi.mock('../../../src/lib/coda-client.js', () => ({
  CodaClient: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue({
      name: 'Test User',
      loginId: 'test@example.com',
      type: 'user',
    }),
  })),
}));

describe('whoami command', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    vi.clearAllMocks();
  });

  it('should register whoami command', () => {
    whoamiCommand(program);
    const whoamiCmd = program.commands.find(cmd => cmd.name() === 'whoami');
    expect(whoamiCmd).toBeDefined();
    expect(whoamiCmd?.description()).toBe('Get current user info');
  });
});
