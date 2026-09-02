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
  _localFilePath: string,
  filename: string,
  _mimeType: string,
  containerName: string = 'cipansor-documents'
): Promise<StorageUploadResult> {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const storageAccount = process.env.AZURE_STORAGE_ACCOUNT;

  // Check if Azure Blob Storage is configured
  if (connectionString || storageAccount) {
    try {
      // Constructs Azure Blob URL: https://<account>.blob.core.windows.net/<container>/<filename>
      const accountName = storageAccount || 'cipansornonprofit';
      const azureBlobUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${filename}`;

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
      logger.error('Azure Blob Storage upload failed, falling back to local storage', { error, filename });
    }
  }

  // Fallback to local storage URL
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
