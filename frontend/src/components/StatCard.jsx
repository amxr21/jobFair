const StatCard = ({ label, value, icon, iconBg = 'bg-green-100', iconColor = 'text-green-600' }) => (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
            {icon && (
                <div className={`p-2 ${iconBg} rounded-lg shrink-0`}>
                    <span className={iconColor}>{icon}</span>
                </div>
            )}
            <div className="min-w-0">
                <p className="text-[10px] text-gray-500 truncate">{label}</p>
                <p className="text-lg font-bold text-gray-800">{value ?? '—'}</p>
            </div>
        </div>
    </div>
);

export default StatCard;
