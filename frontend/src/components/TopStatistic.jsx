import CountUp from "./CountUp";

const TopStatistic = ({data, icon, title, subtitle}) => {

    const capitalize = (word) => word ? word.substring(0,1).toUpperCase() + word.substring(1) : ''

    // Check if the value is a number or percentage
    const value = data[0];
    const isPercentage = typeof value === 'string' && value.includes('%');
    const numericValue = isPercentage ? parseFloat(value) : parseFloat(value);
    const isNumeric = !isNaN(numericValue) && isFinite(numericValue);
    const hasDecimals = value?.toString().includes('.');

    return (
        <div className="statistics-element p-3 bg-white col-span-2 flex flex-col gap-3 rounded-xl max-h-full">
            <div className="icon flex flex-col items-center border-b pb-2">
                {icon}
            </div>

            <div className="flex flex-col gap-1 text-center">
                <h2 className={`name font-bold text-lg truncate`}>
                    {isNumeric ? (
                        <CountUp
                            end={numericValue}
                            duration={1800}
                            suffix={isPercentage ? '%' : ''}
                            decimals={hasDecimals ? 2 : 0}
                        />
                    ) : (
                        capitalize(value)
                    )}
                </h2>
                <p className="text-xs text-gray-500">{title}</p>
            </div>
        </div>
    )
}

export default TopStatistic
