"use client";
import { useState, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, GripHorizontal } from "lucide-react";

interface AdaptiveModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}

/**
 * AdaptiveModal: 
 * - Mobile: Drawer that slides from the bottom.
 * - Desktop: Centered Modal with backdrop.
 */
export default function AdaptiveModal({ title, isOpen, onClose, children, width = "500px" }: AdaptiveModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end lg:items-center justify-center p-0 lg:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Modal/Drawer Container */}
      <div 
        style={{ maxWidth: "95vw", width: width }}
        className={`
          relative bg-[var(--bg-surface)] border border-[var(--border)] 
          shadow-2xl flex flex-col max-h-[90vh] z-10
          transition-all duration-300 ease-out
          
          /* Mobile: Drawer style */
          w-full rounded-t-3xl animate-in slide-in-from-bottom duration-300 lg:animate-none
          
          /* Desktop: Modal style */
          lg:rounded-2xl lg:w-auto lg:h-auto
        `}
      >
        {/* Mobile Drag Handle Indicator */}
        <div className="lg:hidden flex justify-center py-3">
          <div className="w-12 h-1.5 bg-[var(--border)] rounded-full opacity-50" />
        </div>

        {/* Header - Only if title is provided */}
        {title && (
          <div className="flex items-center justify-between px-6 pb-4 lg:py-5 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--brand)] flex items-center justify-center text-white">
                <GripHorizontal size={18} />
              </div>
              <h3 className="text-lg font-black text-[var(--text-primary)] tracking-tight">{title}</h3>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-[var(--bg-base)] text-[var(--text-muted)] hover:bg-red-500 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {!title && (
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-[60] p-3 rounded-full bg-slate-900/10 dark:bg-white/10 text-slate-500 dark:text-neutral-500 hover:bg-red-500 hover:text-white transition-all backdrop-blur-md"
          >
            <X size={20} />
          </button>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
