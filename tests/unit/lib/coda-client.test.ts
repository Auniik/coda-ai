import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodaClient } from '../../../src/lib/coda-client.js';

describe('CodaClient', () => {
  const testToken = 'test-token';
  const baseUrl = 'https://coda.io/apis/v1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with token and default base URL', () => {
      const client = new CodaClient(testToken);
      expect(client).toBeInstanceOf(CodaClient);
    });

    it('should initialize with custom base URL', () => {
      const customUrl = 'https://custom.coda.io/v1';
      const client = new CodaClient(testToken, customUrl);
      expect(client).toBeInstanceOf(CodaClient);
    });
  });

  describe('get', () => {
    it('should make GET request with auth header', async () => {
      const mockResponse = { data: 'test' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const client = new CodaClient(testToken);
      const result = await client.get('/whoami');

      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/whoami`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${testToken}`,
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include query params in URL', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const client = new CodaClient(testToken);
      await client.get('/docs', { limit: 10, query: 'test' });

      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/docs?limit=10&query=test`,
        expect.any(Object)
      );
    });

    it('should throw AuthenticationError on 401', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Invalid token' }),
      });

      const client = new CodaClient(testToken);

      await expect(client.get('/whoami')).rejects.toThrow('Invalid token');
    });

    it('should throw PermissionError on 403', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ message: 'Access denied' }),
      });

      const client = new CodaClient(testToken);

      await expect(client.get('/docs/abc')).rejects.toThrow('Access denied');
    });

    it('should throw NotFoundError on 404', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Doc not found' }),
      });

      const client = new CodaClient(testToken);

      await expect(client.get('/docs/nonexistent')).rejects.toThrow('Doc not found');
    });
  });

  describe('rate limiting', () => {
    it('should retry on 429 with exponential backoff', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Map([['retry-after', '1']]),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: 'success' }),
        });

      global.fetch = mockFetch;

      const client = new CodaClient(testToken);
      const result = await client.get('/whoami');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success' });
    });

    it('should throw RateLimitError after max retries', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Map([['retry-after', '1']]),
      });

      const client = new CodaClient(testToken, undefined, { maxRetries: 2 });

      await expect(client.get('/whoami')).rejects.toThrow('Rate limit exceeded');
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('post', () => {
    it('should make POST request with body', async () => {
      const mockResponse = { id: '123' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const client = new CodaClient(testToken);
      const body = { name: 'Test' };
      const result = await client.post('/docs', body);

      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/docs`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(body),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('put', () => {
    it('should make PUT request with body', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const client = new CodaClient(testToken);
      const body = { title: 'Updated' };
      await client.put('/docs/123', body);

      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/docs/123`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(body),
        })
      );
    });
  });

  describe('delete', () => {
    it('should make DELETE request', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const client = new CodaClient(testToken);
      await client.delete('/docs/123');

      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/docs/123`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });
});
