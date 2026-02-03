import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'upload' | 'browse'>('upload'); // 'upload' or 'browse'
  const [selectedBrowseReportId, setSelectedBrowseReportId] = useState<string | null>(null);


  const [recentProjects] = useState<ProjectReport[]>([]);
  const [reportId, setReportId] = useState<string | null>(null);
  const createReportMutation = useCreateReport();
  const processMultipleMutation = useProcessMultipleDocuments();

  // URL-based state persistence
  const { reportId: urlReportId } = useParams<{ reportId?: string }>();
  const navigate = useNavigate();
  const { data: reportData, isLoading: isLoadingReport } = useReport(urlReportId);

  // Restore state from URL on mount or when report data changes
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
        // Navigate to URL with report ID for state persistence
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
    if (selectedFiles.length === 0) return;
    if (!reportId) {
      alert("Report ID is missing. Please restart.");
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

      setCurrentStep(4);

      const importResponse = await reportsApi.importFiles(reportId);
      if (!importResponse.success) {
        throw new Error("Failed to import files");
      }

      // Trigger Analysis
      const analysisResponse = await reportsApi.analyzeReport(reportId);
      if (analysisResponse && analysisResponse.analysis) {
        setAnalysisResult(analysisResponse.analysis);
      }

      setCurrentStep(5);

    } catch (error) {
      console.error("Error in import/analyze flow:", error);
      alert("An error occurred during processing. Please try again.");
      setFiles(prev => prev.map(f =>
        selectedFiles.includes(f.id) ? { ...f, status: 'error', progress: 0 } : f
      ));
      setCurrentStep(3);
    } finally {
      // Finished
    }
  };

  const handleFinish = () => {
    // Reset all state
    setProjectName('');
    setBankName('');
    setFiles([]);
    setSelectedFiles([]);
    setAnalysisResult(null);
    setReportId(null);
    setCurrentStep(1);
    // Navigate to clean URL for new report
    navigate('/upload');
  };

  const handleCreateProject = () => {
    handleFinish();
  };


  const startNewProject = () => {
    handleFinish();
  };

  const handleReportSelect = (reportId: string) => {
    setSelectedBrowseReportId(reportId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Document Analysis Platform</h1>
            <p className="text-gray-600">Process Tamil land documents with intelligent analysis</p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-3">
            <button
              onClick={() => setViewMode('upload')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${viewMode === 'upload'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
                }`}
            >
              Upload New
            </button>
            <button
              onClick={() => setViewMode('browse')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${viewMode === 'browse'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
                }`}
            >
              <FolderOpen size={20} />
              Browse Reports
            </button>
          </div>
        </div>

        {viewMode === 'browse' ? (
          // Reports Browser View
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
            <div className="grid grid-cols-12 h-full">
              {/* Left Sidebar - Reports List */}
              <div className="col-span-4 border-r border-gray-200 overflow-hidden">
                <ReportsSidebar
                  selectedReportId={selectedBrowseReportId}
                  onReportSelect={handleReportSelect}
                />
              </div>

              {/* Right Content - Report Details */}
              <div className="col-span-8 overflow-hidden">
                <ReportDetailView reportId={selectedBrowseReportId} />
              </div>
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