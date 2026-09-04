import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { uploadToCloudStorage, getStorageConfig } from './cloud-storage';

const { mockUploadFile, mockGetBlockBlobClient, mockCreateIfNotExists, mockGetContainerClient } = vi.hoisted(() => {
  const mockUploadFile = vi.fn().mockResolvedValue({});
  const mockGetBlockBlobClient = vi.fn().mockReturnValue({
    uploadFile: mockUploadFile,
    url: 'https://cipansorstore.blob.core.windows.net/e-office-documents/dummy.pdf',
  });
  const mockCreateIfNotExists = vi.fn().mockResolvedValue({});
  const mockGetContainerClient = vi.fn().mockReturnValue({
    createIfNotExists: mockCreateIfNotExists,
    getBlockBlobClient: mockGetBlockBlobClient,
  });
  return { mockUploadFile, mockGetBlockBlobClient, mockCreateIfNotExists, mockGetContainerClient };
});

vi.mock('@azure/storage-blob', () => {
  return {
    BlobServiceClient: {
      fromConnectionString: vi.fn().mockReturnValue({
        getContainerClient: mockGetContainerClient,
      }),
    },
  };
});

describe('Cloud Storage Utility (Azure Blob Storage Provider)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
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

  it('should upload file to Azure Blob Storage when AZURE_STORAGE_CONNECTION_STRING is configured', async () => {
    process.env.AZURE_STORAGE_CONNECTION_STRING = 'DefaultEndpointsProtocol=https;AccountName=cipansorstore;AccountKey=fakeKey;EndpointSuffix=core.windows.net';
    process.env.AZURE_STORAGE_ACCOUNT = 'cipansorstore';
    process.env.AZURE_STORAGE_KEY = 'fakeKey';

    const result = await uploadToCloudStorage('/tmp/dummy.pdf', 'dummy.pdf', 'application/pdf', 'media-public');
    expect(result.provider).toBe('azure');
    expect(result.url).toBe('https://cipansorstore.blob.core.windows.net/e-office-documents/dummy.pdf');
    expect(mockUploadFile).toHaveBeenCalledWith('/tmp/dummy.pdf', {
      blobHTTPHeaders: { blobContentType: 'application/pdf' },
    });
  });

  it('should throw error when Azure is configured but upload fails', async () => {
    process.env.AZURE_STORAGE_CONNECTION_STRING = 'DefaultEndpointsProtocol=https;AccountName=cipansorstore;AccountKey=fakeKey;EndpointSuffix=core.windows.net';
    mockUploadFile.mockRejectedValueOnce(new Error('Network error'));

    await expect(
      uploadToCloudStorage('/tmp/dummy.pdf', 'dummy.pdf', 'application/pdf', 'e-office-documents')
    ).rejects.toThrow(/Gagal mengunggah berkas ke Azure Blob Storage/);
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
