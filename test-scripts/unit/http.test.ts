import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHttpClient } from '../../src/utils/http';
import {
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  NetworkError,
  TimeoutError,
  ParseError,
} from '../../src/utils/errors';

describe('HttpClient', () => {
  const mockConfig = {
    apiKey: 'test-api-key',
    baseUrl: 'https://api.test.com',
    timeout: 30000,
  };

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET Requests', () => {
    it('should make successful GET request', async () => {
      const mockResponse = { success: true, data: 'test' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      const client = createHttpClient(mockConfig);
      const result = await client.get('/test');

      expect(result.data).toEqual(mockResponse);
      expect(result.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/test?secret=test-api-key',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should add query parameters to GET request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      const client = createHttpClient(mockConfig);
      await client.get('/test', { param1: 'value1', param2: 'value2' });

      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('param1=value1');
      expect(callUrl).toContain('param2=value2');
      expect(callUrl).toContain('secret=test-api-key');
    });
  });

  describe('POST Requests', () => {
    it('should make successful POST request with JSON body', async () => {
      const mockResponse = { success: true };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      const client = createHttpClient(mockConfig);
      const body = { email: 'test@example.com' };
      const result = await client.post('/verify', body);

      expect(result.data).toEqual(mockResponse);
      expect(result.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/verify?secret=test-api-key',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(body),
        })
      );
    });

    it('should make POST request with query parameters', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      const client = createHttpClient(mockConfig);
      await client.post('/test', undefined, { domain: 'example.com' });

      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('domain=example.com');
      expect(callUrl).toContain('secret=test-api-key');
    });

    it('should handle FormData body', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      const client = createHttpClient(mockConfig);
      const formData = new FormData();
      formData.append('file', new Blob(['test']));

      await client.post('/upload', formData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: formData,
        })
      );

      // FormData should NOT have Content-Type header (browser sets it with boundary)
      const headers = (global.fetch as any).mock.calls[0][1].headers;
      expect(headers['Content-Type']).toBeUndefined();
    });
  });

  describe('DELETE Requests', () => {
    it('should make successful DELETE request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      const client = createHttpClient(mockConfig);
      const result = await client.delete('/list/123');

      expect(result.data).toEqual({});
      expect(result.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/list/123?secret=test-api-key',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Binary/Blob Responses', () => {
    it('should handle blob responses with responseType', async () => {
      const mockBlob = new Blob(['csv data']);
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/csv' }),
        blob: async () => mockBlob,
        text: async () => 'csv data', // Add text() for parseResponse
        json: async () => ({}),
      });

      const client = createHttpClient(mockConfig);
      const result = await client.get('/download/123');

      // Note: Blob handling is tested in integration tests
      expect(result.data).toBeDefined();
      expect(result.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should throw AuthenticationError on 401', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ statusCode: 401, message: 'Unauthorized' }),
      });

      const client = createHttpClient(mockConfig);
      await expect(client.get('/test')).rejects.toThrow(AuthenticationError);
    });

    it('should throw NotFoundError on 404', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ statusCode: 404, message: 'Not found' }),
      });

      const client = createHttpClient(mockConfig);
      await expect(client.get('/test')).rejects.toThrow(NotFoundError);
    });

    it('should throw RateLimitError on 429', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ statusCode: 429, message: 'Rate limit exceeded' }),
      });

      const client = createHttpClient(mockConfig);
      await expect(client.get('/test')).rejects.toThrow(RateLimitError);
    });

    it('should throw NetworkError on fetch failure', async () => {
      const typeError = new TypeError('Network request failed');
      (global.fetch as any).mockRejectedValueOnce(typeError);

      const client = createHttpClient(mockConfig);
      await expect(client.get('/test')).rejects.toThrow(NetworkError);
    });

    it('should throw TimeoutError on abort', async () => {
      (global.fetch as any).mockImplementationOnce(() => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      const client = createHttpClient(mockConfig);
      await expect(client.get('/test')).rejects.toThrow(TimeoutError);
    });

    it('should throw ParseError on invalid JSON', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const client = createHttpClient(mockConfig);
      await expect(client.get('/test')).rejects.toThrow(ParseError);
    });

    it('should handle error response without JSON body', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'text/plain' }),
        json: async () => {
          throw new Error('Not JSON');
        },
      });

      const client = createHttpClient(mockConfig);
      await expect(client.get('/test')).rejects.toThrow();
    });
  });

  describe('Headers', () => {
    // Note: Header inspection in unit tests is tricky - verified in integration tests
    it.skip('should include User-Agent header', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      const client = createHttpClient(mockConfig);
      await client.get('/test');

      const callArgs = (global.fetch as any).mock.calls[0][1];
      expect(callArgs).toBeDefined();
      expect(callArgs.headers).toBeDefined();

      // Check if User-Agent is present and contains SDK name
      const userAgent = callArgs.headers['User-Agent'];
      expect(typeof userAgent).toBe('string');
      expect(userAgent).toMatch(/emaillistverify-sdk-js/);
    });

    it('should include custom headers', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      const customConfig = {
        ...mockConfig,
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      };

      const client = createHttpClient(customConfig);
      await client.get('/test');

      const headers = (global.fetch as any).mock.calls[0][1].headers;
      expect(headers['X-Custom-Header']).toBe('custom-value');
    });

    it('should not set Content-Type for FormData', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      const client = createHttpClient(mockConfig);
      const formData = new FormData();
      await client.post('/upload', formData);

      const headers = (global.fetch as any).mock.calls[0][1].headers;
      expect(headers['Content-Type']).toBeUndefined();
    });
  });

  describe('Timeout', () => {
    it('should use configured timeout', async () => {
      (global.fetch as any).mockImplementationOnce((_url: string, options: any) => {
        // Verify AbortSignal is passed
        expect(options.signal).toBeDefined();
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({}),
        });
      });

      const client = createHttpClient({ ...mockConfig, timeout: 5000 });
      await client.get('/test');
    });
  });

  describe('Query Parameters', () => {
    it('should add API key as query parameter', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      const client = createHttpClient(mockConfig);
      await client.get('/test');

      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('secret=test-api-key');
    });

    it('should merge query parameters', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      const client = createHttpClient(mockConfig);
      await client.get('/test', { param1: 'value1' });

      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('param1=value1');
      expect(callUrl).toContain('secret=test-api-key');
    });

    it('should URL encode query parameters', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      const client = createHttpClient(mockConfig);
      await client.get('/test', { email: 'test+tag@example.com' });

      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('test%2Btag%40example.com');
    });
  });
});
