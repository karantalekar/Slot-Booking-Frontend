interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-6 text-center"
    >
      <p className="mb-4 text-red-800">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-block rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
