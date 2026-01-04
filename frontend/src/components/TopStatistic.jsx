const TopStatistic = ({data, icon, title, subtitle}) => {

    const capitalize = (word) => word ? word.substring(0,1).toUpperCase() + word.substring(1) : ''

    return (
        <div className="statistics-element p-3 bg-white col-span-2 flex flex-col gap-3 rounded-xl max-h-full">
            <div className="icon flex flex-col items-center border-b pb-2">
                {icon}
            </div>

            <div className="flex flex-col gap-1 text-center">
                <h2 className={`name font-bold text-lg truncate`}>{typeof data[0] == 'string' ? capitalize(data[0]) : data[0] + '%'}</h2>
                <p className="text-xs text-gray-500">{title}</p>
            </div>
        </div>
    )
}

export default TopStatistic