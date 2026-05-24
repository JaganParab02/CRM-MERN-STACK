import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDangerous = true }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card w-full max-w-md rounded-xl shadow-2xl border border-border overflow-hidden"
          >
            <div className={`p-4 border-b border-border flex justify-between items-center ${isDangerous ? 'bg-destructive/10' : 'bg-primary/10'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isDangerous ? 'bg-destructive/20' : 'bg-primary/20'}`}>
                  <AlertTriangle className={`w-5 h-5 ${isDangerous ? 'text-destructive' : 'text-primary'}`} />
                </div>
                <h3 className="font-semibold text-lg">{title}</h3>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-muted-foreground">{message}</p>
            </div>
            
            <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 rounded-lg font-medium hover:bg-muted transition-colors border border-transparent hover:border-border text-foreground"
              >
                {cancelText}
              </button>
              <button 
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                  isDangerous 
                    ? 'bg-destructive hover:bg-destructive/90 shadow-sm shadow-destructive/20' 
                    : 'bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
