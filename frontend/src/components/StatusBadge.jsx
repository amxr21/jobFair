const STATUS_STYLES = {
    Confirmed:  'bg-[#E5F0FF] text-[#0066CC]',
    Registered: 'bg-[#E5FFE5] text-[#0E7F41]',
    Pending:    'bg-[#FFFACD] text-[#EBC600]',
    Canceled:   'bg-[#FFE5E5] text-[#CC0000]',
};

const StatusBadge = ({ status, className = '' }) => {
    const label = status === true || status === 'Confirmed' ? 'Confirmed'
        : status === false || status === 'Registered' ? 'Registered'
        : status || 'Pending';

    const normalized = ['Confirmed', 'Registered', 'Pending', 'Canceled'].includes(label) ? label : 'Pending';
    const styles = STATUS_STYLES[normalized];

    return (
        <span className={`inline-flex items-center justify-center text-[9px] xl:text-[10px] px-1.5 py-0.5 rounded font-semibold ${styles} ${className}`}>
            {label}
        </span>
    );
};

export default StatusBadge;
