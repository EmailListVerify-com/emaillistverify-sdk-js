/**
 * HTTP client wrapper using native fetch
 * Zero external dependencies - uses Node.js 20+ built-in fetch
 */

import type { ApiErrorResponse } from '../types';
import { createErrorFromResponse, NetworkError, TimeoutError, ParseError } from './errors';

/**
 * HTTP request options
 */
export interface RequestOptions {
  /** Request method */
  method: 'GET' | 'POST' | 'DELETE';
  /** Query parameters */
  params?: Record<string, string | number | boolean | undefined>;
  /** Request body (JSON object or FormData) */
  body?: unknown;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Expected response type */
  responseType?: 'json' | 'text' | 'blob';
}

/**
 * HTTP response wrapper
 */
export interface HttpResponse<T = unknown> {
  /** Response data */
  data: T;
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers: Headers;
}

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  /** Base URL for all requests */
  baseUrl: string;
  /** API key for authentication */
  apiKey: string;
  /** Default timeout in milliseconds */
  timeout: number;
  /** Additional headers to include in all requests */
  headers?: Record<string, string>;
}

/**
 * HTTP client for making API requests
 */
export class HttpClient {
  private readonly config: HttpClientConfig;

  constructor(config: HttpClientConfig) {
    this.config = config;
  }

  /**
   * Make an HTTP request
   */
  async request<T = unknown>(
    path: string,
    options: RequestOptions = { method: 'GET' }
  ): Promise<HttpResponse<T>> {
    const url = this.buildUrl(path, options.params);
    const timeout = options.timeout ?? this.config.timeout;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: options.method,
        headers: this.buildHeaders(options.headers, options.body),
        body: this.buildBody(options.body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle error responses
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Parse response based on expected type
      const data = await this.parseResponse<T>(response, options.responseType);

      return {
        data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(`Request timeout after ${timeout}ms`, error);
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new NetworkError(`Network request failed: ${error.message}`, error);
      }

      // Re-throw our custom errors
      throw error;
    }
  }

  /**
   * Convenience method for GET requests
   */
  async get<T = unknown>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<HttpResponse<T>> {
    return this.request<T>(path, { method: 'GET', params });
  }

  /**
   * Convenience method for POST requests with JSON body
   */
  async post<T = unknown>(
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<HttpResponse<T>> {
    return this.request<T>(path, { method: 'POST', body, params });
  }

  /**
   * Convenience method for POST requests with FormData
   */
  async postFormData<T = unknown>(
    path: string,
    formData: FormData,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<HttpResponse<T>> {
    return this.request<T>(path, { method: 'POST', body: formData, params });
  }

  /**
   * Convenience method for DELETE requests
   */
  async delete<T = unknown>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<HttpResponse<T>> {
    return this.request<T>(path, { method: 'DELETE', params });
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    const url = new URL(path.startsWith('http') ? path : `${this.config.baseUrl}${path}`);

    // Add API key to query params
    url.searchParams.append('secret', this.config.apiKey);

    // Add additional params
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Build request headers
   */
  private buildHeaders(
    customHeaders?: Record<string, string>,
    body?: unknown
  ): Record<string, string> {
    const headers: Record<string, string> = {
      ...this.config.headers,
      ...customHeaders,
    };

    // Set Content-Type for JSON bodies (FormData sets its own)
    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  /**
   * Build request body
   */
  private buildBody(body?: unknown): string | FormData | undefined {
    if (!body) {
      return undefined;
    }

    if (body instanceof FormData) {
      return body;
    }

    return JSON.stringify(body);
  }

  /**
   * Parse response based on content type
   */
  private async parseResponse<T>(
    response: Response,
    expectedType?: 'json' | 'text' | 'blob'
  ): Promise<T> {
    const contentType = response.headers.get('content-type') || '';

    try {
      // Use expected type if provided
      if (expectedType === 'text') {
        return (await response.text()) as T;
      }
      if (expectedType === 'blob') {
        return (await response.blob()) as T;
      }
      if (expectedType === 'json') {
        return (await response.json()) as T;
      }

      // Auto-detect based on content-type
      if (contentType.includes('application/json')) {
        return (await response.json()) as T;
      }

      if (contentType.includes('text/html') || contentType.includes('text/plain')) {
        return (await response.text()) as T;
      }

      // Default to text for unknown types
      return (await response.text()) as T;
    } catch (error) {
      throw new ParseError(
        `Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Handle error responses from API
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorBody: string | ApiErrorResponse | null = null;

    try {
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        errorBody = (await response.json()) as ApiErrorResponse;
      } else {
        errorBody = await response.text();
      }
    } catch {
      // Ignore parse errors, use null
    }

    throw createErrorFromResponse(
      response.status,
      errorBody,
      `HTTP ${response.status}: ${response.statusText}`
    );
  }
}

/**
 * Create HTTP client instance
 */
export function createHttpClient(config: HttpClientConfig): HttpClient {
  return new HttpClient(config);
}
