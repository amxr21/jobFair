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
        <div className="statistics-element p-1.5 md:p-2 bg-white col-span-1 lg:col-span-2 flex flex-col gap-1 md:gap-1.5 rounded-lg max-h-full">
            <div className="icon flex flex-col items-center border-b pb-1">
                {icon}
            </div>

            <div className="flex flex-col gap-0.5 text-center">
                <h2 className={`name font-bold text-xs md:text-sm truncate`}>
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
                <p className="text-[9px] md:text-[10px] text-gray-500 truncate">{title}</p>
            </div>
        </div>
    )
}

export default TopStatistic
