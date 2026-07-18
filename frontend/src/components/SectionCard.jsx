const SectionCard = ({ title, children, className = '', noPad = false }) => (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm ${noPad ? '' : 'p-3 md:p-4'} ${className}`}>
        {title && (
            <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 md:mb-3">
                {title}
            </h3>
        )}
        {children}
    </div>
);

export default SectionCard;
