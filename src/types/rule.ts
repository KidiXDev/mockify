export interface CapturedResponse {
  url: string;
  timestamp: number;
  statusCode: number;
  responseType: 'json' | 'text';
  response: string;
  headers?: Record<string, string>;
}

export interface MockRule {
  id: string;
  name?: string;
  description?: string;
  enabled: boolean;
  urlMatch: string;
  isRegex: boolean;
  responseType: 'json' | 'text';
  mockResponse: string;
  statusCode: number;
  delay: number; // in milliseconds
  mode?: 'mock' | 'record' | 'replay'; // replay mode
  capturedResponses?: CapturedResponse[]; // captured responses for replay
}

export interface Profile {
  id: string;
  name: string;
  rules: MockRule[];
}

export interface MockifyStorage {
  enabled: boolean;
  profiles: Profile[];
  activeProfileId: string;
}

export const DEFAULT_STORAGE: MockifyStorage = {
  enabled: true,
  profiles: [
    {
      id: 'default',
      name: 'Default Profile',
      rules: []
    }
  ],
  activeProfileId: 'default'
};
