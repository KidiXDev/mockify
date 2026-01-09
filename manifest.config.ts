import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Mockify',
  version: '1.1.0',
  description: 'Intercept and modify HTTP responses based on custom rules',

  permissions: ['storage', 'activeTab', 'unlimitedStorage'],
  host_permissions: ['<all_urls>'],

  // @ts-expect-error - browser_specific_settings is required for Firefox but not in the type
  browser_specific_settings: {
    gecko: {
      id: 'mockify@logiclab.id',
      strict_min_version: '109.0'
    }
  },

  background: {
    service_worker: 'src/background/background.ts',
    scripts: ['src/background/background.ts']
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
    '128': 'logo.png',
    '1024': 'logo.png'
  }
});
