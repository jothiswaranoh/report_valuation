import { FolderOpen, Upload as UploadIcon, FileStack, BarChart3, CheckCircle } from 'lucide-react';

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
        <div className="bg-white rounded-2xl shadow-sm border border-secondary-100 p-5 mb-8 overflow-hidden relative">
            <div className="flex items-center justify-between relative z-10">
                {steps.map((step, idx) => (
                    <div key={step.num} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center group">
                            <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 transition-all duration-300 border-2 ${currentStep > step.num
                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100'
                                        : currentStep === step.num
                                            ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-100 ring-4 ring-brand-50'
                                            : 'bg-secondary-50 border-secondary-100 text-secondary-400'
                                    }`}
                            >
                                {currentStep > step.num ? <CheckCircle size={18} /> : <step.icon size={18} />}
                            </div>
                            <span
                                className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${currentStep >= step.num ? 'text-secondary-900' : 'text-secondary-400'
                                    }`}
                            >
                                {step.label}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className="flex-1 mx-4 h-[2px] mb-6 relative">
                                <div className="absolute inset-0 bg-secondary-100 rounded-full" />
                                <div
                                    className="absolute inset-0 bg-emerald-500 rounded-full transition-all duration-700 ease-in-out"
                                    style={{ width: currentStep > step.num ? '100%' : '0%' }}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
