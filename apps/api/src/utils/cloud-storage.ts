import { BlobServiceClient } from '@azure/storage-blob';
import { logger } from '@/lib/logger';

export interface StorageUploadResult {
  url: string;
  provider: 'azure' | 'local';
  filename: string;
}

/**
 * Upload a local file to Cloud Storage (Azure Blob Storage if configured, otherwise local disk)
 */
export async function uploadToCloudStorage(
  localFilePath: string,
  filename: string,
  mimeType: string,
  containerName: string = 'cipansor-documents'
): Promise<StorageUploadResult> {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

  if (connectionString) {
    try {
      const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      const containerClient = blobServiceClient.getContainerClient(containerName);
      await containerClient.createIfNotExists();

      const blockBlobClient = containerClient.getBlockBlobClient(filename);
      await blockBlobClient.uploadFile(localFilePath, {
        blobHTTPHeaders: {
          blobContentType: mimeType,
        },
      });

      const azureBlobUrl = blockBlobClient.url;

      logger.info('File uploaded to Azure Blob Storage', {
        filename,
        container: containerName,
        url: azureBlobUrl,
      });

      return {
        url: azureBlobUrl,
        provider: 'azure',
        filename,
      };
    } catch (error) {
      logger.error('Azure Blob Storage upload failed', { error, filename });
      throw new Error(`Gagal mengunggah berkas ke Azure Blob Storage: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Fallback to local storage URL when Azure is NOT configured
  return {
    url: `/uploads/${filename}`,
    provider: 'local',
    filename,
  };
}

/**
 * Get cloud storage configuration details
 */
export function getStorageConfig() {
  const isAzureConfigured = Boolean(
    process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AZURE_STORAGE_ACCOUNT
  );

  return {
    primaryProvider: isAzureConfigured ? 'azure' : 'local',
    azureConfigured: isAzureConfigured,
    azureAccount: process.env.AZURE_STORAGE_ACCOUNT || null,
    containers: {
      eOffice: 'e-office-documents',
      studentDocs: 'student-documents',
      publicMedia: 'media-public',
    },
  };
}
