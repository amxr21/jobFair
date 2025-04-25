const ScrollToTopButton = ({ scrollableRef, isAtTop }) => {
  const handleScrollToTop = () => {
    scrollableRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      className={`sticky flex items-center justify-center bottom-0 left-0 scroll-to-top p-2 rounded-2xl w-10 h-10 bg-white border shadow-2xl transition-opacity duration-300 ${
        isAtTop ? 'opacity-0' : 'opacity-100'
      }`}
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
