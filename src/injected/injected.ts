interface CapturedResponse {
  url: string;
  timestamp: number;
  statusCode: number;
  responseType: 'json' | 'text';
  response: string;
  headers?: Record<string, string>;
}

interface MockRule {
  id: string;
  enabled: boolean;
  urlMatch: string;
  isRegex: boolean;
  responseType: 'json' | 'text';
  mockResponse: string;
  statusCode: number;
  delay: number;
  mode?: 'mock' | 'record' | 'replay';
  capturedResponses?: CapturedResponse[];
}

interface MockifyConfig {
  enabled: boolean;
  rules: MockRule[];
}

(function () {
  let config: MockifyConfig = {
    enabled: false,
    rules: []
  };

  let configReceived = false;

  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  function findMatchingRule(url: string): MockRule | undefined {
    if (!config.enabled || !configReceived) return undefined;
    return config.rules.find((rule) => {
      if (!rule.enabled) return false;
      if (rule.isRegex) {
        try {
          const regex = new RegExp(rule.urlMatch);
          return regex.test(url);
        } catch (e) {
          console.error(`[Mockify] Invalid regex: ${rule.urlMatch}`, e);
          return false;
        }
      }
      return url.includes(rule.urlMatch);
    });
  }

  function createMockResponse(rule: MockRule): Response {
    const headers = new Headers({
      'Content-Type':
        rule.responseType === 'json' ? 'application/json' : 'text/plain',
      'X-Mockify': 'true'
    });

    let body = rule.mockResponse;
    if (rule.responseType === 'json') {
      try {
        JSON.parse(rule.mockResponse);
      } catch {
        body = JSON.stringify({ error: 'Invalid JSON in mock response' });
      }
    }

    return new Response(body, {
      status: rule.statusCode || 200,
      statusText: getStatusText(rule.statusCode || 200),
      headers: headers
    });
  }

  function getStatusText(code: number): string {
    const statusTexts: { [key: number]: string } = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout'
    };
    return statusTexts[code] || 'Unknown';
  }

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  async function captureResponse(
    url: string,
    response: Response,
    ruleId: string
  ): Promise<void> {
    const clonedResponse = response.clone();
    const responseText = await clonedResponse.text();
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    const capturedResponse: CapturedResponse = {
      url,
      timestamp: Date.now(),
      statusCode: response.status,
      responseType: isJson ? 'json' : 'text',
      response: responseText,
      headers: Object.fromEntries(response.headers.entries())
    };

    window.postMessage(
      {
        type: 'MOCKIFY_RESPONSE_CAPTURED',
        ruleId,
        capturedResponse
      },
      '*'
    );

    console.log(
      `%c[Mockify] Captured response for: ${url}`,
      'color: #f59e0b; font-weight: bold;'
    );
  }

  function getReplayResponse(rule: MockRule): Response {
    const capturedResponses = rule.capturedResponses || [];
    if (capturedResponses.length === 0) {
      return createMockResponse(rule);
    }

    // Use the most recent captured response
    const latestResponse = capturedResponses[capturedResponses.length - 1];
    const headers = new Headers({
      'Content-Type':
        latestResponse.responseType === 'json'
          ? 'application/json'
          : 'text/plain',
      'X-Mockify': 'true',
      'X-Mockify-Mode': 'replay'
    });

    return new Response(latestResponse.response, {
      status: latestResponse.statusCode || 200,
      statusText: getStatusText(latestResponse.statusCode || 200),
      headers: headers
    });
  }

  window.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    const matchingRule = findMatchingRule(url);

    if (matchingRule) {
      const mode = matchingRule.mode || 'mock';

      if (mode === 'record') {
        // In record mode, let the request go through and capture the response
        console.log(
          `%c[Mockify] Recording fetch: ${url}`,
          'color: #f59e0b; font-weight: bold;'
        );

        try {
          const response = await originalFetch.apply(window, [input, init]);
          await captureResponse(url, response, matchingRule.id);
          return response;
        } catch (error) {
          console.error(`[Mockify] Error recording fetch: ${url}`, error);
          throw error;
        }
      } else if (mode === 'replay') {
        // In replay mode, use the captured response
        console.log(
          `%c[Mockify] Replaying fetch: ${url} (Delay: ${matchingRule.delay}ms)`,
          'color: #8b5cf6; font-weight: bold;'
        );

        if (matchingRule.delay > 0) {
          await sleep(matchingRule.delay);
        }

        window.postMessage(
          { type: 'MOCKIFY_MOCK_APPLIED', url, mode: 'replay' },
          '*'
        );
        return getReplayResponse(matchingRule);
      } else {
        // Default mock mode
        console.log(
          `%c[Mockify] Intercepted fetch: ${url} (Delay: ${matchingRule.delay}ms)`,
          'color: #10b981; font-weight: bold;'
        );

        if (matchingRule.delay > 0) {
          await sleep(matchingRule.delay);
        }

        window.postMessage({ type: 'MOCKIFY_MOCK_APPLIED', url }, '*');
        return createMockResponse(matchingRule);
      }
    }

    return originalFetch.apply(window, [input, init]);
  };

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async: boolean = true,
    username?: string | null,
    password?: string | null
  ): void {
    (this as XMLHttpRequest & { _mockifyUrl: string })._mockifyUrl =
      typeof url === 'string' ? url : url.href;
    return originalXHROpen.apply(this, [
      method,
      url,
      async,
      username,
      password
    ]);
  };

  XMLHttpRequest.prototype.send = function (
    body?: Document | XMLHttpRequestBodyInit | null
  ): void {
    const xhr = this as XMLHttpRequest & {
      _mockifyUrl: string;
      _mockifyRule?: MockRule;
    };
    const url = xhr._mockifyUrl;

    const matchingRule = findMatchingRule(url);

    if (matchingRule) {
      const mode = matchingRule.mode || 'mock';

      if (mode === 'record') {
        // In record mode, let the request go through and capture the response
        console.log(
          `%c[Mockify] Recording XHR: ${url}`,
          'color: #f59e0b; font-weight: bold;'
        );

        xhr._mockifyRule = matchingRule;

        // Store original onload handler
        const originalOnLoad = xhr.onload;
        const originalOnReadyStateChange = xhr.onreadystatechange;

        xhr.onreadystatechange = function (event: Event) {
          if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 600) {
            const responseText = xhr.responseText || '';
            const contentType = xhr.getResponseHeader('content-type') || '';
            const isJson = contentType.includes('application/json');

            const capturedResponse: CapturedResponse = {
              url,
              timestamp: Date.now(),
              statusCode: xhr.status,
              responseType: isJson ? 'json' : 'text',
              response: responseText,
              headers: {}
            };

            window.postMessage(
              {
                type: 'MOCKIFY_RESPONSE_CAPTURED',
                ruleId: matchingRule.id,
                capturedResponse
              },
              '*'
            );

            console.log(
              `%c[Mockify] Captured XHR response for: ${url}`,
              'color: #f59e0b; font-weight: bold;'
            );
          }

          if (originalOnReadyStateChange) {
            originalOnReadyStateChange.call(xhr, event);
          }
        };

        if (originalOnLoad) {
          xhr.onload = function (event: ProgressEvent) {
            originalOnLoad.call(xhr, event);
          };
        }

        return originalXHRSend.apply(this, [body]);
      } else if (mode === 'replay') {
        // In replay mode, use the captured response
        console.log(
          `%c[Mockify] Replaying XHR: ${url} (Delay: ${matchingRule.delay}ms)`,
          'color: #8b5cf6; font-weight: bold;'
        );

        const respond = () => {
          window.postMessage(
            { type: 'MOCKIFY_MOCK_APPLIED', url, mode: 'replay' },
            '*'
          );

          const capturedResponses = matchingRule.capturedResponses || [];
          let responseBody = matchingRule.mockResponse;
          let statusCode = matchingRule.statusCode || 200;
          let responseType = matchingRule.responseType;

          if (capturedResponses.length > 0) {
            const latestResponse =
              capturedResponses[capturedResponses.length - 1];
            responseBody = latestResponse.response;
            statusCode = latestResponse.statusCode;
            responseType = latestResponse.responseType;
          }

          Object.defineProperty(xhr, 'readyState', {
            writable: true,
            value: 4
          });

          Object.defineProperty(xhr, 'status', {
            writable: true,
            value: statusCode
          });

          Object.defineProperty(xhr, 'statusText', {
            writable: true,
            value: getStatusText(statusCode)
          });

          Object.defineProperty(xhr, 'responseText', {
            writable: true,
            value: responseBody
          });

          Object.defineProperty(xhr, 'response', {
            writable: true,
            value: responseBody
          });

          const responseHeaders =
            responseType === 'json'
              ? `content-type: application/json\r\nx-mockify: true\r\nx-mockify-mode: replay`
              : `content-type: text/plain\r\nx-mockify: true\r\nx-mockify-mode: replay`;

          xhr.getAllResponseHeaders = function () {
            return responseHeaders;
          };

          xhr.getResponseHeader = function (name: string): string | null {
            const lower = name.toLowerCase();
            if (lower === 'content-type') {
              return responseType === 'json'
                ? 'application/json'
                : 'text/plain';
            }
            if (lower === 'x-mockify') {
              return 'true';
            }
            if (lower === 'x-mockify-mode') {
              return 'replay';
            }
            return null;
          };

          const readyStateEvent = new Event('readystatechange');
          xhr.dispatchEvent(readyStateEvent);

          const loadEvent = new ProgressEvent('load', {
            lengthComputable: true,
            loaded: responseBody.length,
            total: responseBody.length
          });
          xhr.dispatchEvent(loadEvent);

          const loadEndEvent = new ProgressEvent('loadend', {
            lengthComputable: true,
            loaded: responseBody.length,
            total: responseBody.length
          });
          xhr.dispatchEvent(loadEndEvent);

          if (typeof xhr.onreadystatechange === 'function') {
            xhr.onreadystatechange(readyStateEvent as unknown as Event);
          }
          if (typeof xhr.onload === 'function') {
            xhr.onload(loadEvent);
          }
          if (typeof xhr.onloadend === 'function') {
            xhr.onloadend(loadEndEvent);
          }
        };

        if (matchingRule.delay > 0) {
          setTimeout(respond, matchingRule.delay);
        } else {
          setTimeout(respond, 0);
        }

        return;
      } else {
        // Default mock mode
        console.log(
          `%c[Mockify] Intercepted XHR: ${url} (Delay: ${matchingRule.delay}ms)`,
          'color: #10b981; font-weight: bold;'
        );

        const respond = () => {
          window.postMessage({ type: 'MOCKIFY_MOCK_APPLIED', url }, '*');

          Object.defineProperty(xhr, 'readyState', {
            writable: true,
            value: 4
          });

          Object.defineProperty(xhr, 'status', {
            writable: true,
            value: matchingRule.statusCode || 200
          });

          Object.defineProperty(xhr, 'statusText', {
            writable: true,
            value: getStatusText(matchingRule.statusCode || 200)
          });

          let responseBody = matchingRule.mockResponse;
          if (matchingRule.responseType === 'json') {
            try {
              JSON.parse(matchingRule.mockResponse);
            } catch {
              responseBody = JSON.stringify({
                error: 'Invalid JSON in mock response'
              });
            }
          }

          Object.defineProperty(xhr, 'responseText', {
            writable: true,
            value: responseBody
          });

          Object.defineProperty(xhr, 'response', {
            writable: true,
            value: responseBody
          });

          const responseHeaders =
            matchingRule.responseType === 'json'
              ? `content-type: application/json\r\nx-mockify: true`
              : `content-type: text/plain\r\nx-mockify: true`;

          xhr.getAllResponseHeaders = function () {
            return responseHeaders;
          };

          xhr.getResponseHeader = function (name: string): string | null {
            const lower = name.toLowerCase();
            if (lower === 'content-type') {
              return matchingRule.responseType === 'json'
                ? 'application/json'
                : 'text/plain';
            }
            if (lower === 'x-mockify') {
              return 'true';
            }
            return null;
          };

          const readyStateEvent = new Event('readystatechange');
          xhr.dispatchEvent(readyStateEvent);

          const loadEvent = new ProgressEvent('load', {
            lengthComputable: true,
            loaded: responseBody.length,
            total: responseBody.length
          });
          xhr.dispatchEvent(loadEvent);

          const loadEndEvent = new ProgressEvent('loadend', {
            lengthComputable: true,
            loaded: responseBody.length,
            total: responseBody.length
          });
          xhr.dispatchEvent(loadEndEvent);

          if (typeof xhr.onreadystatechange === 'function') {
            xhr.onreadystatechange(readyStateEvent as unknown as Event);
          }
          if (typeof xhr.onload === 'function') {
            xhr.onload(loadEvent);
          }
          if (typeof xhr.onloadend === 'function') {
            xhr.onloadend(loadEndEvent);
          }
        };

        if (matchingRule.delay > 0) {
          setTimeout(respond, matchingRule.delay);
        } else {
          setTimeout(respond, 0);
        }

        return;
      }
    }

    return originalXHRSend.apply(this, [body]);
  };

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;

    if (event.data && event.data.type === 'MOCKIFY_CONFIG_UPDATE') {
      config = event.data.config;
      configReceived = true;
      console.log(
        `%c[Mockify] Config updated: ${config.enabled ? 'enabled' : 'disabled'}, ${config.rules.length} rules`,
        'color: #10b981;'
      );
    }
  });

  window.postMessage({ type: 'MOCKIFY_READY' }, '*');

  setTimeout(() => {
    if (!configReceived) {
      console.log(
        '%c[Mockify] Config not received, requesting...',
        'color: #f59e0b;'
      );
      window.postMessage({ type: 'MOCKIFY_REQUEST_CONFIG' }, '*');
    }
  }, 50);

  setTimeout(() => {
    if (!configReceived) {
      console.log(
        '%c[Mockify] Config still not received after retry',
        'color: #ef4444;'
      );
      window.postMessage({ type: 'MOCKIFY_REQUEST_CONFIG' }, '*');
    }
  }, 200);

  console.log(
    '%c[Mockify] Interceptor initialized',
    'color: #10b981; font-weight: bold;'
  );
})();
