const VARIANTS = {
    blue:   'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
    green:  'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300',
    cyan:   'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300',
    gray:   'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    red:    'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300',
};

const TagPill = ({ label, variant = 'gray', className = '' }) => {
    if (!label) return null;
    return (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${VARIANTS[variant] || VARIANTS.gray} ${className}`}>
            {label}
        </span>
    );
};

export default TagPill;
