import { ReactNode, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    closeOnEsc?: boolean;
    footer?: ReactNode;
}

const sizeStyles: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
};

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEsc = true,
    footer,
}: ModalProps) {
    const handleEscKey = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === 'Escape' && closeOnEsc) {
                onClose();
            }
        },
        [closeOnEsc, onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, handleEscKey]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={closeOnOverlayClick ? onClose : undefined}
            />

            {/* Modal Container */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className={`
            relative w-full ${sizeStyles[size]} bg-white rounded-lg shadow-xl
            transform transition-all
          `}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    {(title || showCloseButton) && (
                        <div className="flex items-center justify-between p-4 border-b border-secondary-200">
                            {title && (
                                <h3 className="text-lg font-semibold text-secondary-900">{title}</h3>
                            )}
                            {showCloseButton && (
                                <button
                                    onClick={onClose}
                                    className="p-1 rounded-md text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Body */}
                    <div className="p-4">{children}</div>

                    {/* Footer */}
                    {footer && (
                        <div className="flex items-center justify-end gap-3 p-4 border-t border-secondary-200">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Modal;
