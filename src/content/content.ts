import injectedRaw from '@/injected/injected.ts?script&module';

interface MockRule {
  id: string;
  enabled: boolean;
  urlMatch: string;
  isRegex: boolean;
  responseType: 'json' | 'text';
  mockResponse: string;
  statusCode: number;
  delay: number;
}

interface Profile {
  id: string;
  name: string;
  rules: MockRule[];
}

interface MockifyConfig {
  enabled: boolean;
  rules: MockRule[];
}

let configSent = false;

async function sendConfigToPage() {
  const result = await chrome.storage.local.get([
    'enabled',
    'profiles',
    'activeProfileId'
  ]);
  const enabled = (result.enabled as boolean) ?? true;
  const profiles = (result.profiles as Profile[]) ?? [];
  const activeProfileId = (result.activeProfileId as string) || profiles[0]?.id;

  const activeProfile =
    profiles.find((p) => p.id === activeProfileId) || profiles[0];
  const rules = activeProfile?.rules || [];

  const config: MockifyConfig = {
    enabled,
    rules
  };

  window.postMessage(
    {
      type: 'MOCKIFY_CONFIG_UPDATE',
      config: config
    },
    '*'
  );

  configSent = true;
  console.log(
    '[Mockify Content] Config sent to page:',
    config.enabled,
    config.rules.length,
    'rules from profile:',
    activeProfile?.name
  );
}

function injectScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL(injectedRaw);
  script.type = 'module';
  (document.head || document.documentElement).appendChild(script);
  script.onload = () => {
    script.remove();
  };
}

const notificationTimeouts = new WeakMap<
  HTMLElement,
  ReturnType<typeof setTimeout>
>();

function showNotification(url: string) {
  const id = 'mockify-notification-root';
  let container = document.getElementById(id);
  let banner: HTMLDivElement;

  if (!container) {
    container = document.createElement('div');
    container.id = id;
    container.style.position = 'fixed';
    container.style.zIndex = '999999';
    container.style.top = '0';
    container.style.right = '0';
    container.style.pointerEvents = 'none';

    const shadow = container.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      .banner {
        position: fixed;
        top: 24px;
        right: 24px;
        background: #0c152a;
        color: white;
        padding: 14px 18px;
        border-radius: 16px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        display: flex;
        align-items: center;
        gap: 14px;
        border: 1px solid #1e293b;
        transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease;
        user-select: none;
        width: 320px;
        pointer-events: auto;
        transform: translateX(400px);
        opacity: 0;
      }
      .banner.show {
        transform: translateX(0);
        opacity: 1;
      }
      .icon-wrapper {
        width: 38px;
        height: 38px;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
      }
      .content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        overflow: hidden;
      }
      .title {
        font-weight: 700;
        font-size: 15px;
        margin: 0;
        color: #f8fafc;
        letter-spacing: -0.01em;
        line-height: 1.2;
      }
      .subtitle {
        font-size: 11px;
        color: #94a3b8;
        margin: 0;
        font-weight: 500;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: block;
        max-width: 100%;
      }
      .close-btn {
        cursor: pointer;
        color: #64748b;
        background: none;
        border: none;
        padding: 6px;
        display: flex;
        border-radius: 8px;
        transition: all 0.2s;
      }
      .close-btn:hover {
        background: #1e293b;
        color: #f8fafc;
      }
      .pulse {
        position: absolute;
        width: 8px;
        height: 8px;
        background: #10b981;
        border-radius: 50%;
        top: -2px;
        right: -2px;
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
        animation: pulse-animation 2s infinite;
      }
      @keyframes pulse-animation {
        0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
        100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }
    `;

    banner = document.createElement('div');
    banner.className = 'banner';

    banner.innerHTML = `
      <div class="icon-wrapper">
        <div style="position: relative;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <div class="pulse"></div>
        </div>
      </div>
      <div class="content">
        <p class="title">Response Mocked</p>
        <p class="subtitle" title="${url}">${url}</p>
      </div>
      <button class="close-btn" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    const closeBtn = banner.querySelector('.close-btn');
    closeBtn?.addEventListener('click', () => {
      banner.classList.remove('show');
      setTimeout(() => container?.remove(), 600);
    });

    shadow.appendChild(style);
    shadow.appendChild(banner);
    document.body.appendChild(container);
  } else {
    banner = container.shadowRoot?.querySelector('.banner') as HTMLDivElement;
    const subtitle = banner.querySelector('.subtitle') as HTMLParagraphElement;
    if (subtitle) {
      subtitle.textContent = url;
      subtitle.title = url;
    }
  }

  // Reset or start animation
  banner.classList.remove('show');
  requestAnimationFrame(() => {
    setTimeout(() => {
      banner.classList.add('show');
    }, 100);
  });

  // Auto-remove after 3 seconds
  const existingTimeout = notificationTimeouts.get(banner);
  if (existingTimeout) clearTimeout(existingTimeout);

  const timeoutId = setTimeout(() => {
    if (document.body.contains(container)) {
      banner.classList.remove('show');
      setTimeout(() => {
        if (document.body.contains(container)) {
          container.remove();
        }
      }, 600);
    }
  }, 3000);
  notificationTimeouts.set(banner, timeoutId);
}

async function init() {
  window.addEventListener('message', async (event) => {
    if (event.source !== window) return;

    if (event.data && event.data.type === 'MOCKIFY_READY') {
      console.log('[Mockify Content] Received MOCKIFY_READY');
      await sendConfigToPage();
    }

    if (event.data && event.data.type === 'MOCKIFY_REQUEST_CONFIG') {
      console.log('[Mockify Content] Received MOCKIFY_REQUEST_CONFIG');
      await sendConfigToPage();
    }

    if (event.data && event.data.type === 'MOCKIFY_MOCK_APPLIED') {
      showNotification(event.data.url);
    }
  });

  injectScript();

  setTimeout(async () => {
    if (!configSent) {
      console.log('[Mockify Content] Sending config after timeout (fallback)');
      await sendConfigToPage();
    }
  }, 100);

  chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === 'local') {
      if (
        changes.enabled !== undefined ||
        changes.profiles !== undefined ||
        changes.activeProfileId !== undefined
      ) {
        console.log(
          '[Mockify Content] Storage changed, sending updated config'
        );
        await sendConfigToPage();
      }
    }
  });
}

init();
