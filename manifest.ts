import type { ManifestV3Export } from '@crxjs/vite-plugin';

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: 'Mockify',
  version: '1.0.0',
  description: 'Intercept and modify HTTP responses based on custom rules',

  permissions: ['storage', 'activeTab'],
  host_permissions: ['<all_urls>'],

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
    '128': 'logo.png',
    '1024': 'logo.png'
  }
};

export default manifest;
