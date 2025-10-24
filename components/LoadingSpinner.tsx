/**
 * Loading Spinner Component
 * Displays loading state with optional message
 */

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="relative">
        {/* Spinner */}
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        
        {/* Pulse effect */}
        <div className="absolute inset-0 w-16 h-16 border-4 border-primary-300 rounded-full animate-ping opacity-20" />
      </div>
      
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">{message}</p>
      
      {/* Loading indicators */}
      <div className="mt-6 flex gap-2">
        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

