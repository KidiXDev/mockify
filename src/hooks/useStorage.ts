import type { MockifyStorage, MockRule } from '@/types/rule';
import { DEFAULT_STORAGE } from '@/types/rule';
import {
  addRule,
  deleteRule,
  generateRuleId,
  getStorage,
  setEnabled,
  setRules,
  toggleRule,
  updateRule
} from '@/utils/storage';
import { useCallback, useEffect, useState } from 'react';

export function useStorage() {
  const [storage, setStorageState] = useState<MockifyStorage>(DEFAULT_STORAGE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadStorage() {
      const data = await getStorage();
      if (mounted) {
        setStorageState(data);
        setLoading(false);
      }
    }

    loadStorage();

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local' && mounted) {
        if (changes.enabled !== undefined) {
          setStorageState((prev) => ({
            ...prev,
            enabled: changes.enabled.newValue as boolean
          }));
        }
        if (changes.rules !== undefined) {
          setStorageState((prev) => ({
            ...prev,
            rules: changes.rules.newValue as MockRule[]
          }));
        }
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => {
      mounted = false;
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  const handleSetEnabled = useCallback(async (enabled: boolean) => {
    await setEnabled(enabled);
  }, []);

  const handleAddRule = useCallback(async (rule: Omit<MockRule, 'id'>) => {
    const newRule: MockRule = {
      ...rule,
      id: generateRuleId()
    };
    await addRule(newRule);
  }, []);

  const handleUpdateRule = useCallback(async (rule: MockRule) => {
    await updateRule(rule);
  }, []);

  const handleDeleteRule = useCallback(async (id: string) => {
    await deleteRule(id);
  }, []);

  const handleToggleRule = useCallback(async (id: string) => {
    await toggleRule(id);
  }, []);

  const handleSetRules = useCallback(async (rules: MockRule[]) => {
    await setRules(rules);
  }, []);

  const reload = useCallback(async () => {
    const data = await getStorage();
    setStorageState(data);
  }, []);

  return {
    storage,
    loading,
    setEnabled: handleSetEnabled,
    addRule: handleAddRule,
    updateRule: handleUpdateRule,
    deleteRule: handleDeleteRule,
    toggleRule: handleToggleRule,
    setRules: handleSetRules,
    reload
  };
}
