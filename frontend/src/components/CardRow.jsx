const CardRow = ({children}) => {
    return (
        <div className="row flex gap-3">
            {children}
        </div>
    )
}

export default CardRow;