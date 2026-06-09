export default function LoadingSpinner({ size = "md", className = "" }) {
  const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" };
  return (
    <svg className={`animate-spin text-brand-500 ${sizes[size] || sizes.md} ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function PageLoading({ message = "Chargement..." }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}
