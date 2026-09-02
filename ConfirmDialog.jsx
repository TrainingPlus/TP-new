import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in" onClick={onCancel}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-8 animate-slide-up text-center" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 mx-auto rounded-full bg-destructive/15 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
