import type { ManifestV3Export } from '@crxjs/vite-plugin';

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: 'Mockify',
  version: '1.1.0',
  description: 'Intercept and modify HTTP responses based on custom rules',

  permissions: ['storage', 'activeTab', 'unlimitedStorage'],
  host_permissions: ['<all_urls>'],

  // @ts-ignore - browser_specific_settings is required for Firefox but not in the type
  browser_specific_settings: {
    gecko: {
      id: 'mockify@kidixdev.com',
      strict_min_version: '109.0'
    }
  },

  background: {
    service_worker: 'src/background/background.ts',
    type: 'module'
  },

  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/content.ts'],
      run_at: 'document_start',
      all_frames: true
    }
  ],

  web_accessible_resources: [],

  action: {
    default_popup: 'index.html',
    default_title: 'Mockify'
  },

  options_page: 'options.html',

  icons: {
    '48': 'logo.png',
    '96': 'logo.png',
    '128': 'logo.png'
  }
};

export default manifest;
