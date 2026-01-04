const OpenEndedResponse = ({response, companyName}) => {
    return (
        <li className="list-none px-4 py-2 bg-white font-semibold min-w-16 rounded-md border shadow-sm">
            <div className="flex flex-col gap-1">
                <span>{response}</span>
                {companyName && (
                    <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded w-fit">
                        {companyName}
                    </span>
                )}
            </div>
        </li>
    )
}

export default OpenEndedResponse