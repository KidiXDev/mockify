import type { MockRule } from '@/types/rule';
import { DEFAULT_STORAGE } from '@/types/rule';
import {
  generateRuleId,
  getStorage,
  addRule as storageAddRule,
  deleteRule as storageDeleteRule,
  setEnabled as storageSetEnabled,
  toggleRule as storageToggleRule,
  updateRule as storageUpdateRule
} from '@/utils/storage';
import { create } from 'zustand';

interface RuleState {
  // Storage State
  rules: MockRule[];
  enabled: boolean;
  loading: boolean;

  // UI State
  editingRule: MockRule | null;
  isEditorOpen: boolean;
  searchQuery: string;

  // Actions
  initialize: () => Promise<() => void>;
  setEnabled: (enabled: boolean) => Promise<void>;
  addRule: (rule: Omit<MockRule, 'id'>) => Promise<void>;
  updateRule: (rule: MockRule) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  toggleRule: (id: string) => Promise<void>;
  setEditingRule: (rule: MockRule | null) => void;
  setIsEditorOpen: (isOpen: boolean) => void;
  setSearchQuery: (query: string) => void;
}

export const useRuleStore = create<RuleState>((set) => ({
  rules: DEFAULT_STORAGE.rules,
  enabled: DEFAULT_STORAGE.enabled,
  loading: true,

  editingRule: null,
  isEditorOpen: false,
  searchQuery: '',

  initialize: async () => {
    const data = await getStorage();
    set({
      rules: data.rules,
      enabled: data.enabled,
      loading: false
    });

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local') {
        if (changes.enabled !== undefined) {
          set({ enabled: changes.enabled.newValue as boolean });
        }
        if (changes.rules !== undefined) {
          set({ rules: changes.rules.newValue as MockRule[] });
        }
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  },

  setEnabled: async (enabled: boolean) => {
    await storageSetEnabled(enabled);
  },

  addRule: async (rule: Omit<MockRule, 'id'>) => {
    const newRule: MockRule = {
      ...rule,
      id: generateRuleId()
    };
    await storageAddRule(newRule);
  },

  updateRule: async (rule: MockRule) => {
    await storageUpdateRule(rule);
  },

  deleteRule: async (id: string) => {
    await storageDeleteRule(id);
  },

  toggleRule: async (id: string) => {
    await storageToggleRule(id);
  },

  setEditingRule: (rule: MockRule | null) => {
    set({ editingRule: rule });
  },

  setIsEditorOpen: (isOpen: boolean) => {
    set({ isEditorOpen: isOpen });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  }
}));
