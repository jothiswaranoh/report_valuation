
import { ProjectReport, UploadedFile } from './types';
import { ValuationReport, ReportMetadata } from '../../types';

export const createInitialMetadata = (projectName: string): ReportMetadata => {
    return {
        year: {
            value: new Date().getFullYear().toString(),
            aiConfidence: 'high',
            needsReview: false
        },
        bankName: { value: 'HDFC Bank', aiConfidence: 'low', needsReview: true },
        month: {
            value: new Date().toLocaleString('default', { month: 'long' }),
            aiConfidence: 'high',
            needsReview: false
        },
        customerName: {
            value: projectName,
            aiConfidence: 'medium',
            needsReview: false
        },
        propertyType: {
            value: 'Residential',
            aiConfidence: 'medium',
            needsReview: false
        },
        location: { value: 'Chennai', aiConfidence: 'low', needsReview: true }
    };
};

export const createReportObject = (
    newProject: ProjectReport,
    files: UploadedFile[],
    selectedFilesIds: string[],
    metadata: ReportMetadata
): ValuationReport => {
    const processedFiles = files.filter((f) => selectedFilesIds.includes(f.id));

    return {
        id: newProject.id,
        customerName: newProject.name,
        bankName: 'HDFC Bank',
        propertyType: 'Residential',
        location: 'Chennai',
        status: 'draft',
        createdAt: newProject.createdAt,
        updatedAt: new Date(),
        year: new Date().getFullYear().toString(),
        month: new Date().toLocaleString('default', { month: 'long' }),
        files: processedFiles.map((f) => ({
            id: f.id,
            name: f.file.name,
            type: 'original',
            size: f.fileSize,
            uploadedAt: f.uploadDate,
            url: URL.createObjectURL(f.file)
        })),
        metadata: metadata,
        content: {
            summary: 'Auto-generated summary awaiting analysis.',
            propertyDetails: 'Details to be extracted.',
            valuationMethod: 'Comparable Sales',
            finalValuation: 'Pending'
        },
        comments: [],
        auditTrail: []
    };
};

export const generateId = (): string => {
    return Math.random().toString(36).substr(2, 9);
};
