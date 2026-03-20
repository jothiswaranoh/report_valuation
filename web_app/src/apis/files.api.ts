import { apiClient } from '../services/apiClient';

/* =========================
   Types
========================= */

export interface ApiFile {
  id: string;
  file_name: string;
  file_path: string;
}

export interface ListFilesResponse {
  success: boolean;
  path: string;
  folders: string[];
  files: ApiFile[];
}

export interface FileActionResponse {
  success: boolean;
  file?: ApiFile;
  message?: string;
}

/* =========================
   API
========================= */

export const filesApi = {
  /**
   * List files and folders at a given path
   * GET /api/v1/files?path={path}
   */
  listFiles: (path: string = '') =>
    apiClient.get<ListFilesResponse>(
      `/api/v1/files?path=${encodeURIComponent(path)}`
    ),

  /**
   * Rename a file
   * PUT /api/v1/files/{file_id}/rename?new_name={newName}
   */
  renameFile: (fileId: string, newName: string) =>
    apiClient.put<FileActionResponse>(
      `/api/v1/files/${fileId}/rename?new_name=${encodeURIComponent(newName)}`
    ),

  /**
   * Move a file to a new path
   * POST /api/v1/files/{file_id}/move?target_path={targetPath}
   */
  moveFile: (fileId: string, targetPath: string) =>
    apiClient.post<FileActionResponse>(
      `/api/v1/files/${fileId}/move?target_path=${encodeURIComponent(targetPath)}`
    ),

  /**
   * Copy a file to a target path
   * POST /api/v1/files/{file_id}/copy?target_path={targetPath}
   */
  copyFile: (fileId: string, targetPath: string) =>
    apiClient.post<FileActionResponse>(
      `/api/v1/files/${fileId}/copy?target_path=${encodeURIComponent(targetPath)}`
    ),

  /**
   * Delete a file
   * DELETE /api/v1/files/{file_id}
   */
  deleteFile: (fileId: string) =>
    apiClient.delete<FileActionResponse>(`/api/v1/files/${fileId}`),
};

export default filesApi;
