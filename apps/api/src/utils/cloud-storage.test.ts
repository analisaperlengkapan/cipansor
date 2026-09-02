import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { uploadToCloudStorage, getStorageConfig } from './cloud-storage';

describe('Cloud Storage Utility (Azure Blob Storage Provider)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return local storage result when Azure is not configured', async () => {
    delete process.env.AZURE_STORAGE_CONNECTION_STRING;
    delete process.env.AZURE_STORAGE_ACCOUNT;

    const result = await uploadToCloudStorage('/tmp/dummy.pdf', 'dummy.pdf', 'application/pdf');
    expect(result.provider).toBe('local');
    expect(result.url).toBe('/uploads/dummy.pdf');
  });

  it('should return Azure Blob Storage URL when AZURE_STORAGE_ACCOUNT is configured', async () => {
    process.env.AZURE_STORAGE_ACCOUNT = 'cipansorstore';

    const result = await uploadToCloudStorage('/tmp/dummy.pdf', 'dummy.pdf', 'application/pdf', 'e-office-documents');
    expect(result.provider).toBe('azure');
    expect(result.url).toBe('https://cipansorstore.blob.core.windows.net/e-office-documents/dummy.pdf');
  });

  it('should report correct storage config status', () => {
    delete process.env.AZURE_STORAGE_CONNECTION_STRING;
    delete process.env.AZURE_STORAGE_ACCOUNT;

    let config = getStorageConfig();
    expect(config.primaryProvider).toBe('local');
    expect(config.azureConfigured).toBe(false);

    process.env.AZURE_STORAGE_ACCOUNT = 'cipansorstore';
    config = getStorageConfig();
    expect(config.primaryProvider).toBe('azure');
    expect(config.azureConfigured).toBe(true);
    expect(config.azureAccount).toBe('cipansorstore');
  });
});
