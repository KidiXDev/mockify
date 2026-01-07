export interface MockRule {
  id: string;
  enabled: boolean;
  urlMatch: string;
  responseType: 'json' | 'text';
  mockResponse: string;
}

export interface MockifyStorage {
  enabled: boolean;
  rules: MockRule[];
}

export const DEFAULT_STORAGE: MockifyStorage = {
  enabled: true,
  rules: []
};
