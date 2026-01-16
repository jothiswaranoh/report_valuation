/**
 * File helper utilities for formatting and validation.
 */

/**
 * Format file size from bytes to human-readable string.
 * 
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string (e.g., "2.4 MB")
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Get file extension from filename.
 * 
 * @param filename - The filename to extract extension from
 * @returns The file extension without the dot, or empty string if none
 */
export function getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === 0) return '';
    return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Check if a file is a PDF based on MIME type or extension.
 * 
 * @param file - File object or filename string
 * @returns True if the file is a PDF
 */
export function isPdfFile(file: File | string): boolean {
    if (typeof file === 'string') {
        return getFileExtension(file) === 'pdf';
    }
    return file.type === 'application/pdf' || getFileExtension(file.name) === 'pdf';
}

/**
 * Check if file size is within allowed limit.
 * 
 * @param file - File object
 * @param maxSizeMB - Maximum allowed size in megabytes
 * @returns True if file size is within limit
 */
export function isFileSizeValid(file: File, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
}

/**
 * Generate a unique file ID.
 * 
 * @returns A unique string ID
 */
export function generateFileId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get MIME type label for display.
 * 
 * @param mimeType - The MIME type string
 * @returns Human-readable label
 */
export function getMimeTypeLabel(mimeType: string): string {
    const labels: Record<string, string> = {
        'application/pdf': 'PDF Document',
        'application/json': 'JSON Data',
        'image/png': 'PNG Image',
        'image/jpeg': 'JPEG Image',
        'text/plain': 'Text File',
        'application/msword': 'Word Document',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    };

    return labels[mimeType] || 'Unknown File';
}

/**
 * Trigger file download in browser.
 * 
 * @param blob - The file blob to download
 * @param filename - The filename for the download
 */
export function downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export default {
    formatFileSize,
    getFileExtension,
    isPdfFile,
    isFileSizeValid,
    generateFileId,
    getMimeTypeLabel,
    downloadFile,
};
