interface MockRule {
  id: string;
  enabled: boolean;
  urlMatch: string;
  responseType: 'json' | 'text';
  mockResponse: string;
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
    return config.rules.find(
      (rule) => rule.enabled && url.includes(rule.urlMatch)
    );
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
      status: 200,
      statusText: 'OK',
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
      console.log(
        `%c[Mockify] Intercepted fetch: ${url}`,
        'color: #10b981; font-weight: bold;'
      );
      window.postMessage({ type: 'MOCKIFY_MOCK_APPLIED', url }, '*');
      return Promise.resolve(createMockResponse(matchingRule));
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
    const xhr = this as XMLHttpRequest & { _mockifyUrl: string };
    const url = xhr._mockifyUrl;

    const matchingRule = findMatchingRule(url);

    if (matchingRule) {
      console.log(
        `%c[Mockify] Intercepted XHR: ${url}`,
        'color: #10b981; font-weight: bold;'
      );
      window.postMessage({ type: 'MOCKIFY_MOCK_APPLIED', url }, '*');

      Object.defineProperty(xhr, 'readyState', {
        writable: true,
        value: 4
      });

      Object.defineProperty(xhr, 'status', {
        writable: true,
        value: 200
      });

      Object.defineProperty(xhr, 'statusText', {
        writable: true,
        value: 'OK'
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
          ? 'content-type: application/json\r\nx-mockify: true'
          : 'content-type: text/plain\r\nx-mockify: true';

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

      setTimeout(() => {
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
      }, 0);

      return;
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
