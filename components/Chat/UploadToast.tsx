import React, { useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { UploadError } from '../../types';

interface UploadToastProps {
  error: UploadError | null;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export const UploadToast: React.FC<UploadToastProps> = ({ 
  error, 
  onDismiss,
  autoDismissMs = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      
      // Auto dismiss after specified time
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for exit animation
      }, autoDismissMs);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [error, autoDismissMs, onDismiss]);

  if (!error) return null;

  return (
    <div 
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-[9999]
        transition-all duration-300 ease-out
        ${isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 -translate-y-2 pointer-events-none'
        }
      `}
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg shadow-lg border border-red-200">
        {/* Error Icon */}
        <div className="flex-shrink-0">
          <AlertCircle size={18} className="text-red-500" />
        </div>
        
        {/* Error Message */}
        <p className="text-13 text-moxt-text-1 font-medium pr-2">
          {error.message}
        </p>
        
        {/* Close Button */}
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="flex-shrink-0 p-1 hover:bg-moxt-fill-1 rounded transition-colors"
        >
          <X size={16} className="text-moxt-text-3" />
        </button>
      </div>
    </div>
  );
};

