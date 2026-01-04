const AuthFormOverlay = ({ type = "loading", message = "" }) => {
  const isLoading = type === "loading";
  const isRedirect = type === "redirect";

  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl transition-all duration-300 ease-in-out animate-fadeIn">
      {isLoading && (
        <>
          {/* Spinner */}
          <div className="relative w-12 h-12 mb-4">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#0E7F41] rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-700 font-medium text-lg transition-all duration-300 ease-in-out">
            {message || "Processing..."}
          </p>
          <p className="text-gray-500 text-sm mt-1 transition-all duration-300 ease-in-out">
            Please wait a moment
          </p>
        </>
      )}

      {isRedirect && (
        <>
          {/* Success Checkmark */}
          <div className="w-16 h-16 mb-4 bg-[#0E7F41] rounded-full flex items-center justify-center animate-scaleIn">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-700 font-medium text-lg transition-all duration-300 ease-in-out">
            {message || "Success!"}
          </p>
          <p className="text-gray-500 text-sm mt-1 transition-all duration-300 ease-in-out">
            Redirecting to dashboard...
          </p>
          {/* Progress bar */}
          <div className="w-48 h-1.5 bg-gray-200 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-[#0E7F41] rounded-full animate-progressBar"></div>
          </div>
        </>
      )}
    </div>
  );
};

export default AuthFormOverlay;
