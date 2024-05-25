


const TableHeader = () => {
    const icon = 
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="cursor-pointer ml-2 bi bi-chevron-expand" viewBox="0 0 16 16">
  <path fillRule="evenodd" d="M3.646 9.146a.5.5 0 0 1 .708 0L8 12.793l3.646-3.647a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 0-.708m0-2.292a.5.5 0 0 0 .708 0L8 3.207l3.646 3.647a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 0 0 0 .708"/>
</svg>
    
    return (
        <>
            <div className="row grid w-[55em] md:w-full py-3 px-2 items-center font-bold">
                <h2 className="flex items-center md:mx-0 mx-2">#</h2>
                <h2 className="flex items-center md:mx-0 mx-2">Full name {icon} </h2>
                <h2 className="flex items-center md:mx-0 mx-2">University ID {icon} </h2>
                <h2 className="flex items-center md:mx-0 mx-2">Major {icon} </h2>
                <h2 className="flex items-center md:mx-0 mx-2">GPA {icon}</h2>
                <h2 className="flex items-center md:mx-0 mx-2">Nationality {icon} </h2>
                <h2 className="flex items-center md:mx-0 mx-2">age {icon} </h2>
            </div>
            <hr></hr>
        </>
    )
}

export default TableHeader;