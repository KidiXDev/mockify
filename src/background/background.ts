import { DEFAULT_STORAGE } from '@/types/rule';

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(['enabled', 'rules']);

  if (existing.enabled === undefined) {
    await chrome.storage.local.set({ enabled: DEFAULT_STORAGE.enabled });
  }

  if (existing.rules === undefined) {
    await chrome.storage.local.set({ rules: DEFAULT_STORAGE.rules });
  }

  console.log('[Mockify] Extension installed/updated');
});

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});
