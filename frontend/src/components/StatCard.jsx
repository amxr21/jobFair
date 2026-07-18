const StatCard = ({ label, value, icon, iconBg = 'bg-green-100 dark:bg-green-500/15', iconColor = 'text-green-600 dark:text-green-300' }) => (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
            {icon && (
                <div className={`p-2 ${iconBg} rounded-lg shrink-0`}>
                    <span className={iconColor}>{icon}</span>
                </div>
            )}
            <div className="min-w-0">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{label}</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{value ?? '—'}</p>
            </div>
        </div>
    </div>
);

export default StatCard;
