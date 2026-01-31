import { apiClient } from '../services/apiClient';
import config from '../config/config';

export interface ProcessResponse {
    success: boolean;
    document_id: string;
    message: string;
    sse_endpoint: string;
    file_name: string;
    file_size_mb: number;
}

export interface SSEEvent {
    event_type: string;
    data: SSEEventData;
    document_id: string;
    timestamp: string;
}

export interface SSEEventData {
    status: string;
    message: string;
    page_number?: number;
    pages_extracted?: number;
    summary?: string;
    total_pages?: number;
}

export interface StoredDocument {
    document_id: string;
    file_name: string;
    total_pages: number;
}

export interface StoredDocumentsResponse {
    success: boolean;
    documents: StoredDocument[];
    total: number;
}

export interface CombineDocumentsResponse {
    success: boolean;
    combination_id: string;
    message: string;
    sse_endpoint: string;
    pdf_endpoint: string;
}

export type SSEEventCallback = (event: SSEEvent) => void;
export type SSEErrorCallback = (error: Error) => void;

export const documentsApi = {
    process: async (file: File): Promise<ProcessResponse> => {
        return apiClient.uploadFile<ProcessResponse>(config.apiEndpoints.process, file);
    },

    processMultiple: async (files: File[], clientName: string, reportId: string): Promise<any> => {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files', file);
        });
        formData.append('client_name', clientName);
        formData.append('report_id', reportId);

        return apiClient.post(config.apiEndpoints.processMultiple, formData);
    },

    getStatus: async (documentId: string): Promise<SSEEventData> => {
        return apiClient.get<SSEEventData>(config.apiEndpoints.status(documentId));
    },

    getStoredDocuments: async (): Promise<StoredDocumentsResponse> => {
        return apiClient.get<StoredDocumentsResponse>(config.apiEndpoints.storedDocuments);
    },

    combineDocuments: async (documentIds: string[]): Promise<CombineDocumentsResponse> => {
        return apiClient.post<CombineDocumentsResponse>(
            config.apiEndpoints.combineDocuments,
            { document_ids: documentIds }
        );
    },

    downloadPdf: async (combinationId: string): Promise<Blob> => {
        return apiClient.downloadBlob(config.apiEndpoints.downloadPdf(combinationId));
    },

    connectToSSE: (
        documentId: string,
        onMessage: SSEEventCallback,
        onError: SSEErrorCallback
    ): EventSource => {
        const eventSource = apiClient.createEventSource(config.apiEndpoints.stream(documentId));

        const eventTypes = [
            'status_update',
            'page_started',
            'page_completed',
            'page_error',
            'error',
        ];

        eventTypes.forEach((eventType) => {
            eventSource.addEventListener(eventType, (event: MessageEvent) => {
                try {
                    const data = JSON.parse(event.data);
                    onMessage({
                        event_type: eventType,
                        data: data.data,
                        document_id: data.document_id,
                        timestamp: data.timestamp,
                    });
                } catch (error) {
                    console.error('Error parsing SSE event:', error);
                }
            });
        });

        eventSource.onerror = (error) => {
            console.error('SSE connection error:', error);
            onError(new Error('SSE connection failed'));
            eventSource.close();
        };

        return eventSource;
    },

    healthCheck: async (): Promise<{ status: string }> => {
        return apiClient.get<{ status: string }>(config.apiEndpoints.health);
    },
};

export default documentsApi;
