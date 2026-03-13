import { CheckCircle, FileText, Clock, BarChart3, ChevronRight, RefreshCw } from 'lucide-react';
import { UploadedFile } from './types';

interface CompletionStepProps {
  files: UploadedFile[];
  selectedFiles: string[];
  onSave: () => void;
  onRestart: () => void;
}

export default function CompletionStep({
  files,
  selectedFiles,
  onSave,
  onRestart,
}: CompletionStepProps) {
  const totalPages = files
    .filter((f) => selectedFiles.includes(f.id) && f.pages)
    .reduce((acc, f) => acc + (f.pages || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Success Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Analysis Complete
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Successfully processed {selectedFiles.length}{' '}
          {selectedFiles.length === 1 ? 'file' : 'files'}. Your comprehensive
          report is ready.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-md bg-sky-100 flex items-center justify-center">
              <FileText size={24} className="text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {selectedFiles.length}
              </p>
              <p className="text-sm text-gray-500">Files Analyzed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-md bg-emerald-100 flex items-center justify-center">
              <Clock size={24} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {totalPages}
              </p>
              <p className="text-sm text-gray-500">Total Pages</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-md bg-purple-100 flex items-center justify-center">
              <BarChart3 size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">100%</p>
              <p className="text-sm text-gray-500">Processing Rate</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pb-4 border-b border-slate-100">
        <button
          onClick={onSave}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-sky-500 text-white font-bold rounded-lg hover:bg-sky-600 transition-all shadow-lg shadow-sky-200 group"
        >
          <span>Proceed to Editor</span>
          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
        <button
          onClick={onRestart}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-white text-sky-600 border-2 border-sky-100 font-bold rounded-lg hover:bg-sky-50 transition-all active:scale-95"
        >
          <RefreshCw size={18} />
          Start New Project
        </button>
      </div>

      {/* Processed Files */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-medium text-gray-900">Processed Files</h3>
        </div>
        <div className="p-4">
          <div className="space-y-2">
            {files
              .filter((f) => selectedFiles.includes(f.id))
              .map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3
                             bg-gray-50 rounded-md
                             hover:bg-gray-100 transition-all"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-green-100 flex items-center justify-center">
                      <CheckCircle size={16} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name || file.file?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {file.pages} {file.pages === 1 ? 'page' : 'pages'}
                        {file.language && ` • ${file.language}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    Completed
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}