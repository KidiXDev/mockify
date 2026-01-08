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
  // Request modification fields
  modifyRequest?: boolean;
  requestMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requestBody?: string;
  queryParams?: string;
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
