import type { MockifyStorage, MockRule } from '@/types/rule';
import { DEFAULT_STORAGE } from '@/types/rule';

export async function getStorage(): Promise<MockifyStorage> {
  const result = await chrome.storage.local.get(['enabled', 'rules']);
  return {
    enabled: (result.enabled as boolean) ?? DEFAULT_STORAGE.enabled,
    rules: (result.rules as MockRule[]) ?? DEFAULT_STORAGE.rules
  };
}

export async function setEnabled(enabled: boolean): Promise<void> {
  await chrome.storage.local.set({ enabled });
}

export async function getRules(): Promise<MockRule[]> {
  const storage = await getStorage();
  return storage.rules;
}

export async function setRules(rules: MockRule[]): Promise<void> {
  await chrome.storage.local.set({ rules });
}

export async function addRule(rule: MockRule): Promise<void> {
  const rules = await getRules();
  rules.push(rule);
  await setRules(rules);
}

export async function updateRule(updatedRule: MockRule): Promise<void> {
  const rules = await getRules();
  const index = rules.findIndex((r) => r.id === updatedRule.id);
  if (index !== -1) {
    rules[index] = updatedRule;
    await setRules(rules);
  }
}

export async function deleteRule(id: string): Promise<void> {
  const rules = await getRules();
  const filtered = rules.filter((r) => r.id !== id);
  await setRules(filtered);
}

export async function toggleRule(id: string): Promise<void> {
  const rules = await getRules();
  const index = rules.findIndex((r) => r.id === id);
  if (index !== -1) {
    rules[index].enabled = !rules[index].enabled;
    await setRules(rules);
  }
}

export function generateRuleId(): string {
  return crypto.randomUUID();
}
