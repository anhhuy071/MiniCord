import { ReactNode, useEffect } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div 
        className="auth-box animate-fade-up" 
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '32px' }}
      >
        <button 
          onClick={onClose}
          className="icon-button"
          style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '20px' }}
          aria-label="Close modal"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
        <h2 className="auth-title" style={{ fontSize: '24px', marginBottom: '24px' }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}
