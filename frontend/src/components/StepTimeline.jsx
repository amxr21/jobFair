const StepTimeline = ({ currentStep, steps }) => {
  return (
    <div className="w-8/10 px-6 mx-auto py-5 border-b border-gray-100 shrink-0 transition-all duration-300 ease-in-out">
      <div className="w-full flex items-center">
        {steps.map((s, idx) => (
          <div key={s.num} className={`flex items-center transition-all duration-300 ease-in-out ${idx < steps.length - 1 ? 'flex-1' : ''}`}>
            {/* Step Circle and Label */}
            <div className="flex flex-col items-center shrink-0 transition-all duration-300 ease-in-out">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ease-in-out ${
                s.num === currentStep
                  ? 'bg-[#0E7F41] text-white shadow-md scale-110'
                  : s.num < currentStep
                    ? 'bg-[#0E7F41]/20 text-[#0E7F41]'
                    : 'bg-gray-100 text-gray-400'
              }`}>
                {s.num < currentStep ? (
                  <svg className="w-5 h-5 transition-all duration-300 ease-in-out" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : s.num}
              </div>
              <span className={`text-xs mt-1.5 font-medium whitespace-nowrap transition-all duration-300 ease-in-out ${s.num === currentStep ? 'text-[#0E7F41]' : 'text-gray-400'}`}>
                {s.title}
              </span>
            </div>

            {/* Connector Line - takes full available space */}
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 transition-all duration-300 ease-in-out ${s.num < currentStep ? 'bg-[#0E7F41]/40' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepTimeline;
