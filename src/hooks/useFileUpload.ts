import { useState, useCallback } from 'react';
import { UploadedFile, ApiResponse } from '@/types/database';

interface UseFileUploadOptions {
  maxFileSize?: number;
  allowedTypes?: string[];
  onUploadProgress?: (progress: number) => void;
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const {
    maxFileSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = [],
    onUploadProgress,
  } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Validate file before upload
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size exceeds ${maxFileSize / 1024 / 1024}MB limit`;
    }

    // Check file type if specified
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`;
    }

    return null;
  }, [maxFileSize, allowedTypes]);

  // Upload single file
  const uploadFile = useCallback(async (
    file: File, 
    type: 'image' | 'model'
  ): Promise<UploadedFile> => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        throw new Error(validationError);
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
            onUploadProgress?.(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const result: ApiResponse<UploadedFile> = JSON.parse(xhr.responseText);
              if (result.success && result.data) {
                setUploadedFiles(prev => [result.data!, ...prev]);
                resolve(result.data);
              } else {
                reject(new Error(result.error || 'Upload failed'));
              }
            } catch (parseError) {
              reject(new Error('Invalid response from server'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('POST', '/api/upload');
        xhr.send(formData);
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [validateFile, onUploadProgress]);

  // Upload multiple files
  const uploadFiles = useCallback(async (
    files: File[], 
    type: 'image' | 'model'
  ): Promise<UploadedFile[]> => {
    const results: UploadedFile[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await uploadFile(files[i], type);
        results.push(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        errors.push(`${files[i].name}: ${errorMessage}`);
      }
    }

    if (errors.length > 0) {
      setError(`Some uploads failed: ${errors.join(', ')}`);
    }

    return results;
  }, [uploadFile]);

  // Get uploaded files list
  const getUploadedFiles = useCallback(async (
    type?: 'image' | 'model',
    page: number = 1,
    limit: number = 20
  ) => {
    setIsUploading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (type) {
        params.append('type', type);
      }

      const response = await fetch(`/api/upload?${params.toString()}`);
      const result: ApiResponse<{
        files: UploadedFile[];
        pagination: any;
      }> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch uploaded files');
      }

      setUploadedFiles(result.data!.files);
      return result.data!;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch files';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Upload image with preview
  const uploadImageWithPreview = useCallback(async (file: File): Promise<{
    uploadedFile: UploadedFile;
    previewUrl: string;
  }> => {
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);

    try {
      const uploadedFile = await uploadFile(file, 'image');
      return { uploadedFile, previewUrl };
    } catch (err) {
      // Clean up preview URL on error
      URL.revokeObjectURL(previewUrl);
      throw err;
    }
  }, [uploadFile]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setUploadedFiles([]);
    setError(null);
    setUploadProgress(0);
    setIsUploading(false);
  }, []);

  return {
    // State
    isUploading,
    uploadProgress,
    error,
    uploadedFiles,

    // Actions
    uploadFile,
    uploadFiles,
    uploadImageWithPreview,
    getUploadedFiles,

    // Utilities
    validateFile,
    clearError,
    reset,

    // Status
    hasFiles: uploadedFiles.length > 0,
    canUpload: !isUploading,
  };
};
