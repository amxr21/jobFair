const ChartTitle = ({title, padding}) => {
    return (
        <h2 className={`pid-header ${padding ? 'px-8' : ''} text-base font-medium text-center mt-4`}>{title}</h2>
    )
}


export default ChartTitle