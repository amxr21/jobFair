const CardRow = ({children}) => {
    return (
        <div className="row mb-2 flex justify-between w-full py-1">
            {children}
        </div>
    )
}

export default CardRow;