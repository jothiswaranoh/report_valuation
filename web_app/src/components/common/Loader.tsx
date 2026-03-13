import { Loader2 } from 'lucide-react';

interface LoaderProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    text?: string;
    fullScreen?: boolean;
}

const sizeMap = {
    sm: 16,
    md: 24,
    lg: 48,
};

export function Loader({
    size = 'md',
    className = '',
    text,
    fullScreen = false,
}: LoaderProps) {
    const spinner = (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            <Loader2
                size={sizeMap[size]}
                className="text-sky-500 animate-spin"
            />
            {text && (
                <p className="text-sm text-slate-500 font-medium">{text}</p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
                {spinner}
            </div>
        );
    }

    return spinner;
}

export default Loader;
