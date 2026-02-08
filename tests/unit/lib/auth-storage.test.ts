import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { saveCredentials, getCredentials, hasCredentials, deleteCredentials } from '../../../src/lib/auth-storage.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

vi.mock('fs');

describe('auth-storage', () => {
  const testToken = 'test-api-token';
  const mockConfigDir = path.join(os.homedir(), '.coda-ai');
  const mockConfigFile = path.join(mockConfigDir, 'config.json');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveCredentials', () => {
    it('should save credentials to config file', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
      vi.mocked(fs.writeFileSync).mockReturnValue(undefined);
      vi.mocked(fs.readFileSync).mockReturnValue('{}');

      await saveCredentials(testToken);

      expect(fs.mkdirSync).toHaveBeenCalledWith(mockConfigDir, { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigFile,
        JSON.stringify({ apiToken: testToken }, null, 2),
        { mode: 0o600 }
      );
    });

    it('should throw error if file write fails', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{}');
      vi.mocked(fs.writeFileSync).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      await expect(saveCredentials(testToken)).rejects.toThrow('Failed to save credentials');
    });
  });

  describe('getCredentials', () => {
    it('should retrieve credentials from config file', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({ apiToken: testToken })
      );

      const token = await getCredentials();

      expect(token).toBe(testToken);
    });

    it('should return null if config file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const token = await getCredentials();

      expect(token).toBeNull();
    });

    it('should return null if no token in config', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{}');

      const token = await getCredentials();

      expect(token).toBeNull();
    });

    it('should handle invalid JSON gracefully', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('invalid json');

      const token = await getCredentials();

      expect(token).toBeNull();
    });
  });

  describe('hasCredentials', () => {
    it('should return true if credentials exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({ apiToken: testToken })
      );

      const result = await hasCredentials();

      expect(result).toBe(true);
    });

    it('should return false if no credentials exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await hasCredentials();

      expect(result).toBe(false);
    });
  });

  describe('deleteCredentials', () => {
    it('should delete config file', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.unlinkSync).mockReturnValue(undefined);

      await deleteCredentials();

      expect(fs.unlinkSync).toHaveBeenCalledWith(mockConfigFile);
    });

    it('should handle deletion when file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      await expect(deleteCredentials()).resolves.not.toThrow();
    });
  });
});
