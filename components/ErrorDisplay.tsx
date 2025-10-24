/**
 * Error Display Component
 * Shows error messages with retry option
 */

interface ErrorDisplayProps {
  message: string;
  error?: any;
  onRetry?: () => void;
  onBack?: () => void;
}

export default function ErrorDisplay({
  message,
  error,
  onRetry,
  onBack,
}: ErrorDisplayProps) {
  const errorDetails = error?.response?.data?.error?.message || error?.message;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="card max-w-lg w-full text-center bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        {/* Error Icon */}
        <div className="text-6xl mb-4">⚠️</div>
        
        {/* Error Message */}
        <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
          {message}
        </h3>
        
        {errorDetails && (
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            {errorDetails}
          </p>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-3 justify-center mt-6">
          {onRetry && (
            <button onClick={onRetry} className="btn btn-primary">
              🔄 Retry
            </button>
          )}
          {onBack && (
            <button onClick={onBack} className="btn btn-secondary">
              ← Go Back
            </button>
          )}
        </div>
        
        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400">
            If the problem persists, please check:
          </p>
          <ul className="text-xs text-red-600 dark:text-red-400 mt-2 space-y-1">
            <li>• Your internet connection</li>
            <li>• The wallet address is correct</li>
            <li>• API services are operational</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

