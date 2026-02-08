import {
  AuthenticationError,
  PermissionError,
  NotFoundError,
  RateLimitError,
  CliError,
} from '../types/errors.js';

interface RequestOptions {
  maxRetries?: number;
}

export class CodaClient {
  private baseUrl: string;
  private apiToken: string;
  private maxRetries: number;

  constructor(
    apiToken: string,
    baseUrl: string = 'https://coda.io/apis/v1',
    options: RequestOptions = {}
  ) {
    this.apiToken = apiToken;
    this.baseUrl = baseUrl;
    this.maxRetries = options.maxRetries ?? 3;
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = this.buildUrl(endpoint, params);
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    const url = this.buildUrl(endpoint);
    return this.request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<T> {
    const url = this.buildUrl(endpoint);
    return this.request<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    const url = this.buildUrl(endpoint);
    return this.request<T>(url, { method: 'DELETE' });
  }

  async *paginate<T>(endpoint: string, params?: Record<string, any>): AsyncGenerator<T> {
    let pageToken: string | undefined;
    
    do {
      const queryParams = pageToken ? { pageToken } : params;
      const response: any = await this.get(endpoint, queryParams);
      
      if (response.items) {
        for (const item of response.items) {
          yield item as T;
        }
      }
      
      pageToken = response.nextPageToken;
    } while (pageToken);
  }

  async exportPageContent(docId: string, pageId: string, format: 'html' | 'markdown' = 'markdown'): Promise<string> {
    const exportResponse: any = await this.post(`/docs/${docId}/pages/${pageId}/export`, {
      outputFormat: format,
    });

    const requestId = exportResponse.requestId || exportResponse.id;
    if (!requestId) {
      throw new CliError('Export request did not return a request ID', 'EXPORT_ERROR');
    }

    const maxAttempts = 30;
    const pollInterval = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await this.sleep(pollInterval);

      const statusResponse: any = await this.get(`/docs/${docId}/pages/${pageId}/export/${requestId}`);

      if (statusResponse.status === 'complete') {
        if (!statusResponse.downloadLink) {
          throw new CliError('Export completed but no download link provided', 'EXPORT_ERROR');
        }

        const contentResponse = await fetch(statusResponse.downloadLink);
        if (!contentResponse.ok) {
          throw new CliError('Failed to download exported content', 'EXPORT_ERROR');
        }

        return await contentResponse.text();
      }

      if (statusResponse.status === 'failed') {
        const errorMsg = statusResponse.error || 'Export failed';
        throw new CliError(`Export failed: ${errorMsg}`, 'EXPORT_ERROR');
      }
    }

    throw new CliError('Export timed out after 60 seconds', 'EXPORT_TIMEOUT');
  }

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const fullPath = endpoint.startsWith('/') ? `${this.baseUrl}${endpoint}` : endpoint;
    const url = new URL(fullPath);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  private async request<T>(
    url: string,
    options: RequestInit & { headers?: Record<string, string> },
    retryCount = 0
  ): Promise<T> {
    const headers = {
      Authorization: `Bearer ${this.apiToken}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 429) {
      if (retryCount >= this.maxRetries) {
        throw new RateLimitError('Rate limit exceeded after max retries');
      }

      const retryAfter = parseInt(response.headers.get('retry-after') || '1');
      await this.sleep(retryAfter * 1000);
      return this.request<T>(url, options, retryCount + 1);
    }

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    return response.json() as Promise<T>;
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = response.statusText;
    
    try {
      const errorBody = await response.json() as any;
      errorMessage = errorBody.message || errorMessage;
    } catch {
      
    }

    switch (response.status) {
      case 401:
        throw new AuthenticationError(errorMessage);
      case 403:
        throw new PermissionError(errorMessage);
      case 404:
        throw new NotFoundError(errorMessage);
      case 429:
        throw new RateLimitError(errorMessage);
      default:
        throw new CliError(errorMessage, 'API_ERROR', response.status);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
