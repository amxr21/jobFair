import { useTranslation } from "react-i18next";
import { tStatus } from "../i18n/translateEnum";

// Two-tier status colors: soft tint + readable text in BOTH light and dark.
// The dark: twin keeps the color MEANING (blue/green/amber/red) on a dark canvas
// instead of relying on the blanket auto-reversal, which would wash these out.
const STATUS_STYLES = {
    Confirmed:  'bg-[#E5F0FF] text-[#0066CC] dark:bg-blue-500/15 dark:text-blue-300',
    Registered: 'bg-[#E5FFE5] text-[#0E7F41] dark:bg-primary/15 dark:text-emerald-300',
    Pending:    'bg-[#FFFACD] text-[#997e00] dark:bg-amber-500/15 dark:text-amber-300',
    Canceled:   'bg-[#FFE5E5] text-[#CC0000] dark:bg-red-500/15 dark:text-red-300',
};

const StatusBadge = ({ status, className = '' }) => {
    useTranslation(); // subscribe to language changes so tStatus() re-renders
    const key = status === true || status === 'Confirmed' ? 'Confirmed'
        : status === false || status === 'Registered' ? 'Registered'
        : status || 'Pending';

    const normalized = ['Confirmed', 'Registered', 'Pending', 'Canceled'].includes(key) ? key : 'Pending';
    const styles = STATUS_STYLES[normalized];
    // DB value stays English; label is translated for display only.
    const label = tStatus(normalized);

    return (
        <span className={`inline-flex items-center justify-center text-[9px] xl:text-[10px] px-1.5 py-0.5 rounded font-semibold ${styles} ${className}`}>
            {label}
        </span>
    );
};

export default StatusBadge;
