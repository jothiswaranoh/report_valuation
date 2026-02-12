import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LayoutGrid, Plus, History } from 'lucide-react';
import StepIndicator from './upload/StepIndicator';
import ProjectNameStep from './upload/ProjectNameStep';
import UploadStep from './upload/UploadStep';
import FileSelectionStep from './upload/FileSelectionStep';
import ProcessingStep from './upload/ProcessingStep';
import CompletionStep from './upload/CompletionStep';
import ReportsSidebar from './upload/ReportsSidebar';
import ReportDetailView from './upload/ReportDetailView';
import { UploadedFile, ProjectReport } from './upload/types';
import { useCreateReport, useReport } from '../hooks/useReports';
import { useProcessMultipleDocuments } from '../hooks/useDocuments';
import { reportsApi } from '../apis/report.api';

export default function Upload() {
  const [currentStep, setCurrentStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [bankName, setBankName] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'upload' | 'browse'>('upload');
  const [selectedBrowseReportId, setSelectedBrowseReportId] = useState<string | null>(null);

  const [recentProjects] = useState<ProjectReport[]>([]);
  const [reportId, setReportId] = useState<string | null>(null);
  const createReportMutation = useCreateReport();
  const processMultipleMutation = useProcessMultipleDocuments();

  const { reportId: urlReportId } = useParams<{ reportId?: string }>();
  const navigate = useNavigate();
  const { data: reportData, isLoading: isLoadingReport } = useReport(urlReportId);

  useEffect(() => {
    if (urlReportId && reportData && !isLoadingReport) {
      // Restore report details
      setReportId(reportData.id);
      setProjectName(reportData.name);
      setBankName(reportData.bank_name || '');

      // Fetch analysis results if the report has been processed
      // This allows users to view completed reports after refresh
      const fetchAnalysis = async () => {
        try {
          const analysisResponse = await reportsApi.analyzeReport(reportData.id);
          if (analysisResponse && analysisResponse.analysis) {
            setAnalysisResult(analysisResponse.analysis);
            setCurrentStep(5); // Go to completion step if analysis exists
          } else {
            // No analysis yet, go to upload step
            setCurrentStep(2);
          }
        } catch (error) {
          // Analysis might not exist yet, that's okay
          console.log('No analysis found for this report yet');
          setCurrentStep(2); // Go to upload step
        }
      };

        fetchAnalysis();
      }
    }
  }, [urlReportId, reportData, isLoadingReport]);

  const handleCreateReport = async () => {
    try {
      const response = await createReportMutation.mutateAsync({
        name: projectName,
        bank_name: bankName,
      });

      const createdReport = 'id' in response ? response : (response as any).reports?.[0];

      if (createdReport?.id) {
        setReportId(createdReport.id);
        navigate(`/upload/${createdReport.id}`);
        setCurrentStep(2);
      } else {
        throw new Error("Report ID not found in response");
      }
    } catch (err) {
      console.error('Failed to create report', err);
      alert('Failed to create report. Try another name.');
    }
  };

  const handleImportAndAnalyze = async () => {
    const effectiveReportId = reportId || urlReportId;
    if (selectedFiles.length === 0) {
      alert("No files selected.");
      return;
    }
    if (!effectiveReportId) {
      alert("Report ID is missing. Please restart or check the URL.");
      return;
    }
    setCurrentStep(4);
    try {
      const filesToUpload = files
        .filter(f => selectedFiles.includes(f.id))
        .map(f => f.file);

      if (filesToUpload.length === 0) {
        throw new Error("No files selected for upload.");
      }

      setFiles(prev => prev.map(f =>
        selectedFiles.includes(f.id) ? { ...f, status: 'processing', progress: 10 } : f
      ));

      // Import Data (Process Files)
      await processMultipleMutation.mutateAsync({
        files: filesToUpload,
        clientName: projectName,
        reportId: reportId
      });

      setFiles(prev => prev.map(f =>
        selectedFiles.includes(f.id) ? { ...f, status: 'completed', progress: 100 } : f
      ));

      await reportsApi.importFiles(effectiveReportId);
      const analysisResponse = await reportsApi.analyzeReport(effectiveReportId);

      if (analysisResponse && analysisResponse.analysis) {
        setAnalysisResult(analysisResponse.analysis);
      }
      setCurrentStep(5);
    } catch (error: any) {
      console.error("Error in import/analyze flow:", error);
      alert(`Processing error: ${error.message || "Unknown error"}`);
      setFiles(prev => prev.map(f =>
        selectedFiles.includes(f.id) ? { ...f, status: 'error', progress: 0 } : f
      ));
      setCurrentStep(3);
    }
  };

  const handleFinish = () => {
    setProjectName('');
    setBankName('');
    setFiles([]);
    setSelectedFiles([]);
    setAnalysisResult(null);
    setReportId(null);
    setCurrentStep(1);
    navigate('/upload');
  };

  const handleCreateProject = () => {
    const effectiveReportId = reportId || urlReportId;
    if (!effectiveReportId) {
      alert('Report ID is missing. Cannot save report.');
      return;
    }
    navigate(`/reports/${effectiveReportId}/edit`);
  };

  const handleUpload = (newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'pending',
      progress: 0,
      uploadDate: new Date(),
      fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
    }));

    setFiles(prev => [...prev, ...uploadedFiles]);
    setSelectedFiles(prev => [...prev, ...uploadedFiles.map(f => f.id)]);
  };

  const handleDownload = async (file: UploadedFile) => {
    if (file.file) {
      const url = URL.createObjectURL(file.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (file.serverFileId) {
      try {
        const blob = await reportsApi.downloadFile(file.serverFileId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to download file', error);
      }
    }
  };

  const handleSaveReport = async () => {
    if (!reportId) return;
    try {
      const blob = await reportsApi.downloadReport(reportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName || 'report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
      alert("Failed to download report");
    }
  };

  // Immediate upload handler for Step 2
  const handleFileUpload = async (newFiles: File[]) => {
    if (!reportId) {
      alert("Report ID missing. Please restart project.");
      return;
    }

    // optimizing: add to UI first
    const tempFiles: UploadedFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'uploading',
      progress: 0,
      uploadDate: new Date(),
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    }));

    setFiles(prev => [...prev, ...tempFiles]);

    try {
      // simulate progress
      setFiles(prev => prev.map(f =>
        tempFiles.find(tf => tf.id === f.id)
          ? { ...f, progress: 50 }
          : f
      ));

      // Actual Upload
      const response = await reportsApi.uploadFiles(reportId, newFiles);

      if (response && (response.success || (response as any).files)) { // check response structure
        // Reload report to get server IDs and correct state? 
        // Or just mark as success.
        // Better to mark as success and rely on server IDs later or reload.
        // For now, mark success.

        setFiles(prev => prev.map(f =>
          tempFiles.find(tf => tf.id === f.id)
            ? { ...f, status: 'completed', progress: 100 }
            : f
        ));

        // Also select them by default
        setSelectedFiles(prev => [...prev, ...tempFiles.map(f => f.id)]);
      }
    } catch (error) {
      console.error("Immediate upload failed", error);
      setFiles(prev => prev.map(f =>
        tempFiles.find(tf => tf.id === f.id)
          ? { ...f, status: 'error', error: 'Upload failed' }
          : f
      ));
    }
  };

  const handleDownloadFile = async (file: UploadedFile) => {
    // We need a server file ID. 
    // If we have serverFileId (from restore) use it.
    // If we just uploaded, we might not have it unless we re-fetched.
    // But typically for freshly uploaded files we might need to rely on the 'response' mapping.
    // For now, try 'id' if it looks like a server ID (UUID) or use 'serverFileId'.

    // If file has status 'completed' and we restored it, it has 'id' as server ID.
    // If we just uploaded it, 'id' is random string.

    const targetId = (file as any).serverFileId || file.id;

    try {
      const blob = await reportsApi.downloadFile(targetId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error("File download failed", e);
      // alert("Could not download file. It might not be saved on server yet.");
      // Fallback: if it's a local file object (freshly added), we can download it from memory
      if (file.file) {
        const url = window.URL.createObjectURL(file.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-40 bg-[#f8fafc]/95 dark:bg-slate-900/95 backdrop-blur-md pb-4 pt-4 md:pt-6 lg:pt-8 -mt-4 md:-mt-6 lg:-mt-8 px-4 md:px-6 lg:px-8 -mx-4 md:-mx-6 lg:-mx-8 transition-all border-b border-transparent data-[stuck=true]:border-gray-200 dark:data-[stuck=true]:border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl shadow-xl flex items-center justify-center border border-slate-100 dark:border-slate-800 transform -rotate-2">
              <Plus className="text-brand-600 dark:text-brand-400" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Generate Analysis</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Create a new comprehensive valuation report using AI.</p>
            </div>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
            <button
              onClick={() => setViewMode('upload')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${viewMode === 'upload'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
                }`}
            >
              <LayoutGrid size={18} />
              Wizard
            </button>
            <button
              onClick={() => setViewMode('browse')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${viewMode === 'browse'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
                }`}
            >
              <History size={18} />
              History
            </button>
          </div>
        </div>

        {viewMode !== 'browse' && (
          <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl p-1 shadow-inner border border-slate-100 dark:border-slate-800">
            <StepIndicator currentStep={currentStep} />
          </div>
        )}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pt-6">
        {viewMode === 'browse' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 h-[calc(100vh-12rem)] min-h-[600px] items-start">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full">
              <ReportsSidebar
                selectedReportId={selectedBrowseReportId}
                onReportSelect={setSelectedBrowseReportId}
              />
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden h-full relative">
              <ReportDetailView reportId={selectedBrowseReportId} />
            </div>
          </div>
        ) : (
          // Upload Flow View
          <>
            <StepIndicator currentStep={currentStep} />

            {currentStep === 1 && (
              <ProjectNameStep
                projectName={projectName}
                setProjectName={setProjectName}
                bankName={bankName}
                setBankName={setBankName}
                onNext={handleCreateReport}
                recentProjects={recentProjects}
              />
            )}

            {currentStep === 2 && (
              <UploadStep
                projectName={projectName}
                files={files}
                onFilesChange={(newFilesList) => {
                  if (newFilesList.length > files.length) {
                    // Files added
                    const addedFiles = newFilesList.filter(
                      (nf) => !files.find((of) => of.id === nf.id)
                    );
                    setFiles(newFilesList);
                    setSelectedFiles((prev) => [...prev, ...addedFiles.map((f) => f.id)]);
                  } else {
                    // Files removed (or same)
                    setFiles(newFilesList);
                    // Cleanup selectedFiles
                    const newIds = new Set(newFilesList.map((f) => f.id));
                    setSelectedFiles((prev) => prev.filter((id) => newIds.has(id)));
                  }
                }}
                onNext={() => setCurrentStep(3)}
                onBack={() => setCurrentStep(1)}
              />
            )}

            {currentStep === 3 && (
              <FileSelectionStep
                files={files}
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
                onFilesChange={setFiles}
                onBack={() => setCurrentStep(2)}
                onNext={handleImportAndAnalyze}
              />
            )}

            {currentStep === 4 && (
              <ProcessingStep files={files} selectedFiles={selectedFiles} />
            )}

            {currentStep === 5 && (
              <CompletionStep
                files={files}
                selectedFiles={selectedFiles}
                analysisResult={analysisResult}
                onSave={handleCreateProject}
                onRestart={startNewProject}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}