'use client';

import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  recordName?: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmationModal({
  isOpen,
  title,
  message,
  recordName,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-message"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onCancel();
      }}
    >
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <Trash2 className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
            aria-label="Cancel deletion"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <h2 id="delete-dialog-title" className="text-lg font-black text-slate-900 tracking-tight">
            {title}
          </h2>
          <p id="delete-dialog-message" className="text-xs text-slate-600 leading-relaxed">
            {message}
          </p>

          {recordName && (
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Record</span>
              <p className="text-xs font-bold text-slate-800 break-all">{recordName}</p>
            </div>
          )}
        </div>

        <div className="pt-2 flex flex-col-reverse sm:flex-row items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm shadow-rose-600/30 disabled:opacity-60 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

