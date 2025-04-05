const TopStatistic = ({data, icon, title, subtitle}) => {
    
    const capitalize = (word) => word.substring(0,1).toUpperCase() + word.substring(1)

    return (
        <div className="statistics-element p-4 bg-white col-span-4 flex flex-col gap-5 rounded-xl">
            <div className="icon flex flex-col items-center border-b pb-3">
                {icon}
            </div>

            <div className="flex gap-6">
                <h2 className={`name w-4/12 font-bold ${typeof data[0] == 'string' ? 'text-2xl' : 'text-3xl' } flex items-center justify-center text-center border-r`}>{typeof data[0] == 'string' ? capitalize(data[0]) : data[0] + '%'}</h2>
                <div className="flex flex-col gap-y-2 grow">
                    <p className="title w-8/12 font-light text-2xl font-semibold flex items-center">{`${data[1]} ${subtitle}`}</p>
                    <p className="title w-8/12 font-light text-sm flex items-center ">{title}</p>
                </div>
            </div>
        </div>
    )
}

export default TopStatistic