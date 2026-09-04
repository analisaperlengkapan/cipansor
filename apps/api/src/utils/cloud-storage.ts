import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob';
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
      // Set container access to blob level for public media or private for sensitive documents
      const isPublicContainer = containerName === 'media-public';
      await containerClient.createIfNotExists({
        access: isPublicContainer ? 'blob' : undefined,
      });

      const blockBlobClient = containerClient.getBlockBlobClient(filename);
      await blockBlobClient.uploadFile(localFilePath, {
        blobHTTPHeaders: {
          blobContentType: mimeType,
        },
      });

      let azureBlobUrl = blockBlobClient.url;

      // If container is private, generate a SAS URL with 24-hour expiry
      if (!isPublicContainer) {
        if (!process.env.AZURE_STORAGE_ACCOUNT || !process.env.AZURE_STORAGE_KEY) {
          throw new Error('Kunci AZURE_STORAGE_KEY dan AZURE_STORAGE_ACCOUNT wajib dikonfigurasi untuk container privat.');
        }

        const sharedKeyCredential = new StorageSharedKeyCredential(
          process.env.AZURE_STORAGE_ACCOUNT,
          process.env.AZURE_STORAGE_KEY
        );
        const sasToken = generateBlobSASQueryParameters(
          {
            containerName,
            blobName: filename,
            permissions: BlobSASPermissions.parse('r'),
            startsOn: new Date(),
            expiresOn: new Date(new Date().valueOf() + 24 * 60 * 60 * 1000),
          },
          sharedKeyCredential
        ).toString();

        azureBlobUrl = `${blockBlobClient.url}?${sasToken}`;
      }

      logger.info('File uploaded to Azure Blob Storage', {
        filename,
        container: containerName,
        rawUrl: blockBlobClient.url,
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
