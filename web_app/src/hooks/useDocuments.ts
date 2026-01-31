import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '../apis/documents.api';

export function useProcessMultipleDocuments() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            files,
            clientName,
            reportId,
        }: {
            files: File[];
            clientName: string;
            reportId: string;
        }) => documentsApi.processMultiple(files, clientName, reportId),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            // Also maybe invalidate reports since documents are added to a report?
            queryClient.invalidateQueries({ queryKey: ['reports'] });
        },
    });
}
