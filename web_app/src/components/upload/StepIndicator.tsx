import { Share2, FolderOpen, Upload as UploadIcon, FileStack, BarChart3, CheckCircle } from 'lucide-react';

interface StepIndicatorProps {
    currentStep: number;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
    const steps = [
        { num: 1, label: 'Project Name', icon: FolderOpen },
        { num: 2, label: 'Upload Files', icon: UploadIcon },
        { num: 3, label: 'Select Files', icon: FileStack },
        { num: 4, label: 'Process', icon: BarChart3 },
        { num: 5, label: 'Complete', icon: CheckCircle }
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between">
                {steps.map((step, idx) => (
                    <div key={step.num} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${currentStep > step.num
                                        ? 'bg-green-500 text-white'
                                        : currentStep === step.num
                                            ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                            : 'bg-gray-200 text-gray-500'
                                    }`}
                            >
                                {currentStep > step.num ? <CheckCircle size={24} /> : <step.icon size={24} />}
                            </div>
                            <span
                                className={`text-sm font-medium ${currentStep >= step.num ? 'text-gray-900' : 'text-gray-500'
                                    }`}
                            >
                                {step.label}
                            </span>
                        </div>
                        {idx < 4 && (
                            <div
                                className={`h-1 flex-1 mx-2 mb-8 rounded transition-all ${currentStep > step.num ? 'bg-green-500' : 'bg-gray-200'
                                    }`}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
