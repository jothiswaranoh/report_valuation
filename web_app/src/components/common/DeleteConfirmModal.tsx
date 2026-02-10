import { Modal } from './Modal';
import { Button } from './Button';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isDeleting?: boolean;
}

export default function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isDeleting = false,
}: DeleteConfirmModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={onConfirm}
                        isLoading={isDeleting}
                    >
                        Delete
                    </Button>
                </>
            }
        >
            <div className="py-2">
                <p className="text-secondary-600">{message}</p>
            </div>
        </Modal>
    );
}
