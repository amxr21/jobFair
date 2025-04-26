const Action = ({type, handleClick}) => {

    switch(type){
        case 'shortlist':
            return (
                <button onClick={handleClick} className="flex flex-col border border-blue-300 text-blue-800 bg-blue-50 w-24 gap-1 py-1.5 rounded-xl text-sm justify-center items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 stroke-blue-800">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                    </svg>
                    <h2>Shortlist</h2>

                </button>
            )
            
            case 'reject':
            return (
                <button onClick={handleClick} className="flex flex-col border border-red-300 text-red-800 bg-red-50 w-24 gap-1 py-1.5 rounded-xl text-sm justify-center items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>

                    <h2>Reject</h2>

                </button>
            )
            
            default:
            return (
                <button className="flex flex-col gap-1 border p-2 rounded-xl text-sm justify-center items-center">
                    {type == 'reject' ? "Reject" : 'Shortlist'}
                </button>
            )

    }

}


export default Action