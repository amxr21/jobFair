const ChartTitle = ({title, padding}) => {
    return (
        <h2 className={`pid-header ${padding ? 'px-8' : ''} text-xl font-medium text-center mt-6`}>{title}</h2>
    )
}


export default ChartTitle