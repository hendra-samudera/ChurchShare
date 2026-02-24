package com.churchshare.service;

import com.churchshare.exception.StorageException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.InputStream;
import java.net.URI;
import java.time.Duration;
import java.util.UUID;

/**
 * Service for S3-compatible storage operations (Cloudflare R2).
 * Handles file upload, download, delete, and presigned URL generation.
 */
@Slf4j
@Service
public class R2StorageService {

    @Value("${app.storage.r2.endpoint}")
    private String r2Endpoint;

    @Value("${app.storage.r2.access-key}")
    private String r2AccessKey;

    @Value("${app.storage.r2.secret-key}")
    private String r2SecretKey;

    @Value("${app.storage.r2.bucket-name}")
    private String r2BucketName;

    private S3Client s3Client;
    private S3Presigner s3Presigner;

    /**
     * Initialize S3 client lazily.
     */
    private S3Client getS3Client() {
        if (s3Client == null) {
            this.s3Client = S3Client.builder()
                    .region(Region.of("auto"))  // R2 uses "auto" region
                    .endpointOverride(URI.create(r2Endpoint))
                    .credentialsProvider(StaticCredentialsProvider.create(
                            AwsBasicCredentials.create(r2AccessKey, r2SecretKey)))
                    .serviceConfiguration(S3Configuration.builder()
                            .pathStyleAccessEnabled(true)
                            .build())
                    .build();
        }
        return s3Client;
    }

    /**
     * Initialize S3 presigner lazily.
     */
    private S3Presigner getS3Presigner() {
        if (s3Presigner == null) {
            this.s3Presigner = S3Presigner.builder()
                    .region(Region.of("auto"))
                    .endpointOverride(URI.create(r2Endpoint))
                    .credentialsProvider(StaticCredentialsProvider.create(
                            AwsBasicCredentials.create(r2AccessKey, r2SecretKey)))
                    .serviceConfiguration(S3Configuration.builder()
                            .pathStyleAccessEnabled(true)
                            .build())
                    .build();
        }
        return s3Presigner;
    }

    /**
     * Upload a file to storage.
     * 
     * @param fileKey The storage key (path) for the file
     * @param inputStream The file content
     * @param contentType The MIME type of the file
     * @param contentLength The file size in bytes
     * @return The storage key of the uploaded file
     */
    public String uploadFile(String fileKey, InputStream inputStream, String contentType, long contentLength) {
        try {
            S3Client client = getS3Client();
            
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(r2BucketName)
                    .key(fileKey)
                    .contentType(contentType)
                    .contentLength(contentLength)
                    .build();

            client.putObject(putObjectRequest, RequestBody.fromInputStream(inputStream, contentLength));
            
            log.info("File uploaded successfully: {}", fileKey);
            return fileKey;
            
        } catch (Exception e) {
            log.error("Failed to upload file: {}", fileKey, e);
            throw StorageException.uploadFailed(e.getMessage());
        }
    }

    /**
     * Delete a file from storage.
     * 
     * @param fileKey The storage key of the file to delete
     */
    public void deleteFile(String fileKey) {
        try {
            S3Client client = getS3Client();
            
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(r2BucketName)
                    .key(fileKey)
                    .build();

            client.deleteObject(deleteObjectRequest);
            
            log.info("File deleted successfully: {}", fileKey);
            
        } catch (Exception e) {
            log.error("Failed to delete file: {}", fileKey, e);
            throw StorageException.deleteFailed(fileKey);
        }
    }

    /**
     * Check if a file exists in storage.
     * 
     * @param fileKey The storage key to check
     * @return true if the file exists, false otherwise
     */
    public boolean fileExists(String fileKey) {
        try {
            S3Client client = getS3Client();
            
            HeadObjectRequest headObjectRequest = HeadObjectRequest.builder()
                    .bucket(r2BucketName)
                    .key(fileKey)
                    .build();

            client.headObject(headObjectRequest);
            return true;
            
        } catch (NoSuchKeyException e) {
            return false;
        } catch (Exception e) {
            log.error("Error checking file existence: {}", fileKey, e);
            return false;
        }
    }

    /**
     * Get file metadata from storage.
     * 
     * @param fileKey The storage key of the file
     * @return HeadObjectResponse containing metadata
     */
    public HeadObjectResponse getFileMetadata(String fileKey) {
        try {
            S3Client client = getS3Client();
            
            HeadObjectRequest headObjectRequest = HeadObjectRequest.builder()
                    .bucket(r2BucketName)
                    .key(fileKey)
                    .build();

            return client.headObject(headObjectRequest);
            
        } catch (NoSuchKeyException e) {
            throw StorageException.fileNotFound(fileKey);
        } catch (Exception e) {
            log.error("Error getting file metadata: {}", fileKey, e);
            throw new StorageException("Failed to get file metadata: " + e.getMessage());
        }
    }

    /**
     * Generate a presigned URL for downloading a file.
     * The URL is valid for 15 minutes by default.
     * 
     * @param fileKey The storage key of the file
     * @return Presigned URL string
     */
    public String generatePresignedUrl(String fileKey) {
        return generatePresignedUrl(fileKey, Duration.ofMinutes(15));
    }

    /**
     * Generate a presigned URL for downloading a file with custom expiration.
     * 
     * @param fileKey The storage key of the file
     * @param duration How long the URL should be valid
     * @return Presigned URL string
     */
    public String generatePresignedUrl(String fileKey, Duration duration) {
        try {
            S3Presigner presigner = getS3Presigner();
            
            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(duration)
                    .getObjectRequest(builder -> builder
                            .bucket(r2BucketName)
                            .key(fileKey))
                    .build();

            PresignedGetObjectRequest presignedRequest = presigner.presignGetObject(presignRequest);
            
            log.debug("Generated presigned URL for: {} (valid for {})", fileKey, duration);
            return presignedRequest.url().toString();
            
        } catch (Exception e) {
            log.error("Failed to generate presigned URL: {}", fileKey, e);
            throw new StorageException("Failed to generate download URL: " + e.getMessage());
        }
    }

    /**
     * Get an input stream for downloading a file.
     * 
     * @param fileKey The storage key of the file
     * @return InputStream for the file content
     */
    public InputStream downloadFile(String fileKey) {
        try {
            S3Client client = getS3Client();
            
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(r2BucketName)
                    .key(fileKey)
                    .build();

            return client.getObject(getObjectRequest);
            
        } catch (NoSuchKeyException e) {
            throw StorageException.fileNotFound(fileKey);
        } catch (Exception e) {
            log.error("Failed to download file: {}", fileKey, e);
            throw new StorageException("Failed to download file: " + e.getMessage());
        }
    }

    /**
     * Generate a unique storage key for a new file.
     * 
     * @param churchId The church ID
     * @param slotId The slot ID
     * @return Unique storage key
     */
    public String generateStorageKey(UUID churchId, UUID slotId) {
        return String.format("churches/%s/slots/%s/%s.pdf",
                churchId,
                slotId,
                UUID.randomUUID());
    }
}
