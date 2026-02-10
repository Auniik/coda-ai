import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authCommand } from '../../../src/commands/auth.js';
import { Command } from 'commander';

vi.mock('../../../src/lib/auth-storage.js', () => ({
  saveCredentials: vi.fn().mockResolvedValue(undefined),
  hasCredentials: vi.fn().mockResolvedValue(false),
}));

describe('auth command', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    vi.clearAllMocks();
  });

  it('should register auth command', () => {
    authCommand(program);
    const authCmd = program.commands.find(cmd => cmd.name() === 'auth');
    expect(authCmd).toBeDefined();
    expect(authCmd?.description()).toBe('Configure Coda API authentication');
  });

  it('should have from-file option', () => {
    authCommand(program);
    const authCmd = program.commands.find(cmd => cmd.name() === 'auth');
    const fromFileOption = authCmd?.options.find(opt => opt.long === '--from-file');
    expect(fromFileOption).toBeDefined();
  });
});
