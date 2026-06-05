const ScrollToTopButton = ({ scrollableRefC, isAtTop }) => {
  const handleScrollToTop = () => {
    scrollableRefC.current?.scrollTo({top: 0});
  };

  return (
    <button
      className={`absolute flex items-center justify-center bottom-3 left-1/2 -translate-x-1/2 scroll-to-top p-1.5 rounded-lg w-7 h-7 bg-white border border-gray-200 shadow-md transition-opacity duration-300 pointer-events-auto ${
        isAtTop ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      onClick={handleScrollToTop}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
        />
      </svg>
    </button>
  );
};

export default ScrollToTopButton;
