import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { loadSettings, isCommandAllowed, isDocAllowed, getDefaultSettingsPath } from '../../../src/lib/settings.js';
import { join } from 'path';
import { tmpdir } from 'os';

describe('settings', () => {
  let tempSettingsPath: string;

  beforeEach(() => {
    tempSettingsPath = join(tmpdir(), `test-settings-${Date.now()}.yaml`);
  });

  afterEach(() => {
    if (existsSync(tempSettingsPath)) {
      unlinkSync(tempSettingsPath);
    }
  });

  describe('loadSettings', () => {
    it('should load settings from YAML file', () => {
      const settingsContent = `
docs:
  - doc-123
  - doc-456
commands:
  - whoami
  - docs
`;
      writeFileSync(tempSettingsPath, settingsContent);

      const settings = loadSettings(tempSettingsPath);

      expect(settings.docs).toEqual(['doc-123', 'doc-456']);
      expect(settings.commands).toEqual(['whoami', 'docs']);
    });

    it('should throw error if file does not exist', () => {
      expect(() => loadSettings('/nonexistent/path.yaml')).toThrow('Settings file not found');
    });

    it('should handle "all" keyword', () => {
      const settingsContent = `
docs:
  - all
commands:
  - all
`;
      writeFileSync(tempSettingsPath, settingsContent);

      const settings = loadSettings(tempSettingsPath);

      expect(settings.docs).toEqual(['all']);
      expect(settings.commands).toEqual(['all']);
    });

    it('should handle operations restrictions', () => {
      const settingsContent = `
docs:
  - all
commands:
  - all
operations:
  rows:
    - read
    - create
  docs:
    - read
`;
      writeFileSync(tempSettingsPath, settingsContent);

      const settings = loadSettings(tempSettingsPath);

      expect(settings.operations?.rows).toEqual(['read', 'create']);
      expect(settings.operations?.docs).toEqual(['read']);
    });
  });

  describe('isCommandAllowed', () => {
    it('should return true when command is in allowed list', () => {
      const settings = {
        docs: ['all'],
        commands: ['whoami', 'docs', 'tables'],
      };

      expect(isCommandAllowed('whoami', settings)).toBe(true);
      expect(isCommandAllowed('docs', settings)).toBe(true);
    });

    it('should return false when command is not in allowed list', () => {
      const settings = {
        docs: ['all'],
        commands: ['whoami'],
      };

      expect(isCommandAllowed('delete-doc', settings)).toBe(false);
    });

    it('should return true for any command when set to "all"', () => {
      const settings = {
        docs: ['all'],
        commands: ['all'],
      };

      expect(isCommandAllowed('whoami', settings)).toBe(true);
      expect(isCommandAllowed('any-command', settings)).toBe(true);
      expect(isCommandAllowed('delete-doc', settings)).toBe(true);
    });
  });

  describe('isDocAllowed', () => {
    it('should return true when doc is in allowed list', () => {
      const settings = {
        docs: ['doc-123', 'doc-456'],
        commands: ['all'],
      };

      expect(isDocAllowed('doc-123', settings)).toBe(true);
      expect(isDocAllowed('doc-456', settings)).toBe(true);
    });

    it('should return false when doc is not in allowed list', () => {
      const settings = {
        docs: ['doc-123'],
        commands: ['all'],
      };

      expect(isDocAllowed('doc-999', settings)).toBe(false);
    });

    it('should return true for any doc when set to "all"', () => {
      const settings = {
        docs: ['all'],
        commands: ['all'],
      };

      expect(isDocAllowed('doc-123', settings)).toBe(true);
      expect(isDocAllowed('any-doc-id', settings)).toBe(true);
    });
  });

  describe('getDefaultSettingsPath', () => {
    it('should return path to settings.yaml', () => {
      const path = getDefaultSettingsPath();
      expect(path).toContain('settings.yaml');
    });
  });
});
