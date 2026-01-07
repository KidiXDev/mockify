import type { MockifyStorage, MockRule, Profile } from '@/types/rule';
import { DEFAULT_STORAGE } from '@/types/rule';

export async function getStorage(): Promise<MockifyStorage> {
  const result = await chrome.storage.local.get([
    'enabled',
    'profiles',
    'activeProfileId',
    'rules'
  ]);

  // Migration logic
  if (result.rules && !result.profiles) {
    const migratedRules = (result.rules as MockRule[]).map((rule) => ({
      ...rule,
      isRegex: rule.isRegex ?? false,
      statusCode: rule.statusCode ?? 200,
      delay: rule.delay ?? 0
    }));

    const defaultProfile: Profile = {
      id: 'default',
      name: 'Default Profile',
      rules: migratedRules
    };

    const newStorage: MockifyStorage = {
      enabled: (result.enabled as boolean) ?? DEFAULT_STORAGE.enabled,
      profiles: [defaultProfile],
      activeProfileId: 'default'
    };

    await chrome.storage.local.set(newStorage);
    await chrome.storage.local.remove('rules');
    return newStorage;
  }

  return {
    enabled: (result.enabled as boolean) ?? DEFAULT_STORAGE.enabled,
    profiles: (result.profiles as Profile[]) ?? DEFAULT_STORAGE.profiles,
    activeProfileId:
      (result.activeProfileId as string) ?? DEFAULT_STORAGE.activeProfileId
  };
}

export async function setEnabled(enabled: boolean): Promise<void> {
  await chrome.storage.local.set({ enabled });
}

export async function getActiveProfile(): Promise<Profile> {
  const storage = await getStorage();
  return (
    storage.profiles.find((p) => p.id === storage.activeProfileId) ||
    storage.profiles[0]
  );
}

export async function getRules(): Promise<MockRule[]> {
  const profile = await getActiveProfile();
  return profile.rules;
}

export async function setRules(rules: MockRule[]): Promise<void> {
  const storage = await getStorage();
  const index = storage.profiles.findIndex(
    (p) => p.id === storage.activeProfileId
  );
  if (index !== -1) {
    storage.profiles[index].rules = rules;
    await chrome.storage.local.set({ profiles: storage.profiles });
  }
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

export async function duplicateRule(id: string): Promise<void> {
  const rules = await getRules();
  const rule = rules.find((r) => r.id === id);
  if (rule) {
    const duplicated: MockRule = {
      ...rule,
      id: crypto.randomUUID(),
      urlMatch: `${rule.urlMatch} (Copy)`
    };
    rules.push(duplicated);
    await setRules(rules);
  }
}

export async function switchProfile(profileId: string): Promise<void> {
  await chrome.storage.local.set({ activeProfileId: profileId });
}

export async function addProfile(name: string): Promise<void> {
  const storage = await getStorage();
  const newProfile: Profile = {
    id: crypto.randomUUID(),
    name,
    rules: []
  };
  storage.profiles.push(newProfile);
  await chrome.storage.local.set({ profiles: storage.profiles });
}

export async function deleteProfile(id: string): Promise<void> {
  const storage = await getStorage();
  if (storage.profiles.length <= 1) return; // Don't delete last profile

  const filtered = storage.profiles.filter((p) => p.id !== id);
  let activeId = storage.activeProfileId;
  if (activeId === id) {
    activeId = filtered[0].id;
  }
  await chrome.storage.local.set({
    profiles: filtered,
    activeProfileId: activeId
  });
}

export function generateRuleId(): string {
  return crypto.randomUUID();
}
