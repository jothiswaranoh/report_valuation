import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import StepIndicator from './upload/StepIndicator';
import ProjectNameStep from './upload/ProjectNameStep';
import UploadStep from './upload/UploadStep';
import FileSelectionStep from './upload/FileSelectionStep';
import ProcessingStep from './upload/ProcessingStep';
import CompletionStep from './upload/CompletionStep';
import { UploadedFile, ProjectReport } from './upload/types';
import { createInitialMetadata, createReportObject, generateId } from './upload/uploadHelpers';

export default function Upload() {
  const [currentStep, setCurrentStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const [recentProjects, setRecentProjects] = useState<ProjectReport[]>([
    {
      id: '1',
      name: 'Tamil Land Documents - Jan 2024',
      createdAt: new Date('2024-01-15'),
      fileCount: 12,
      status: 'completed'
    },
    {
      id: '2',
      name: 'Bank Reports Analysis',
      createdAt: new Date('2024-01-10'),
      fileCount: 8,
      status: 'completed'
    }
  ]);

  const { addReport } = useAppStore();

  const handleImportAndAnalyze = () => {
    if (selectedFiles.length === 0) return;

    setCurrentStep(4);

    setFiles((prev) =>
      prev.map((file) => ({
        ...file,
        status: selectedFiles.includes(file.id) ? 'processing' : file.status,
        progress: selectedFiles.includes(file.id) ? 50 : file.progress
      }))
    );

    setTimeout(() => {
      setFiles((prev) =>
        prev.map((file) => ({
          ...file,
          status: selectedFiles.includes(file.id) ? 'completed' : file.status,
          progress: selectedFiles.includes(file.id) ? 100 : file.progress,
          pages: selectedFiles.includes(file.id)
            ? Math.floor(Math.random() * 20) + 1
            : file.pages,
          language: selectedFiles.includes(file.id) ? 'Tamil' : file.language
        }))
      );
      setCurrentStep(5);
    }, 3000);
  };

  const handleCreateProject = () => {
    const newProject: ProjectReport = {
      id: generateId(),
      name: projectName,
      createdAt: new Date(),
      fileCount: selectedFiles.length,
      status: 'completed'
    };
    setRecentProjects((prev) => [newProject, ...prev]);

    // Add to global store
    const initialMetadata = createInitialMetadata(projectName);
    const newReport = createReportObject(newProject, files, selectedFiles, initialMetadata);

    addReport(newReport);

    setProjectName('');
    setFiles([]);
    setSelectedFiles([]);
    setCurrentStep(1);
  };

  const startNewProject = () => {
    setProjectName('');
    setFiles([]);
    setSelectedFiles([]);
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Document Analysis Platform</h1>
          <p className="text-gray-600">Process Tamil land documents with intelligent analysis</p>
        </div>

        <StepIndicator currentStep={currentStep} />

        {currentStep === 1 && (
          <ProjectNameStep
            projectName={projectName}
            setProjectName={setProjectName}
            onNext={() => setCurrentStep(2)}
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
            onSave={handleCreateProject}
            onRestart={startNewProject}
          />
        )}
      </div>
    </div>
  );
}