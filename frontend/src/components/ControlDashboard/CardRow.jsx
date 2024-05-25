const CardRow = ({children}) => {
    return (
        <div className="row mb-2 flex flex-col gap-y-4 md:flex-row justify-between w-full py-1">
            {children}
        </div>
    )
}

export default CardRow;