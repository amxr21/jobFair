const VARIANTS = {
    blue:   'bg-blue-100 text-blue-800',
    green:  'bg-green-100 text-green-800',
    cyan:   'bg-cyan-100 text-cyan-800',
    purple: 'bg-purple-100 text-purple-800',
    gray:   'bg-gray-100 text-gray-700',
    red:    'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
};

const TagPill = ({ label, variant = 'gray', className = '' }) => {
    if (!label) return null;
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${VARIANTS[variant] || VARIANTS.gray} ${className}`}>
            {label}
        </span>
    );
};

export default TagPill;
