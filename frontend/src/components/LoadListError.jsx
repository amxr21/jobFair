// Shared "failed to load" state for list pages — distinguishes a genuine
// fetch failure from an empty list (which uses NoApplicants instead), so the
// user sees a clear retry action rather than a misleading "nothing here".
const LoadListError = ({ onRetry, label = "items" }) => (
    <div className="flex flex-col gap-2 items-center justify-center mt-4 border w-full p-3 rounded-xl text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 text-red-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <p className="text-sm">Couldn&apos;t load {label}</p>
        <button
            onClick={onRetry}
            className="text-xs px-3 py-1.5 rounded-md bg-[#0E7F41] text-white hover:bg-[#0a5f31] transition-colors font-medium"
        >
            Try again
        </button>
    </div>
);

export default LoadListError;
