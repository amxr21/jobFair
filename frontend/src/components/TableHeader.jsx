const TableHeader = ({userType}) => {
    const icon = 
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="cursor-pointer ml-2 bi bi-chevron-expand" viewBox="0 0 16 16">
        <path fillRule="evenodd" d="M3.646 9.146a.5.5 0 0 1 .708 0L8 12.793l3.646-3.647a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 0-.708m0-2.292a.5.5 0 0 0 .708 0L8 3.207l3.646 3.647a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 0 0 0 .708"/>
    </svg>
    

    return userType != 'manager'
    ?
        <>
            <div className="row grid py-4 pl-7 pr-14 rounded-xl font-bold">
                <h2 className="flex items-center">#</h2>
                <h2 className="flex items-center">Name {icon} </h2>
                <h2 className="flex items-center">University ID {icon} </h2>
                <h2 className="flex items-center">Age {icon} </h2>
                <h2 className="flex items-center">CGPA {icon}</h2>
                <h2 className="flex items-center">Major {icon} </h2>
                <h2 className="flex items-center">Attendance</h2>
                <h2 className="flex text-[#F3F6FF] items-center">.</h2>
            </div> 
        </>
    :
    <>
            <div className="row-manager grid py-4 pl-7 pr-14 rounded-xl font-bold">
                <h2 className="flex items-center">#</h2>
                <h2 className="flex items-center">Company Name {icon} </h2>
                <h2 className="flex items-center">Company Email {icon} </h2>
                <h2 className="flex items-center">Representatives {icon} </h2>
                <h2 className="flex items-center">Fields of interest {icon} </h2>
                <h2 className="flex items-center">Applicants {icon} </h2>
                <h2 className="flex items-center">Status</h2> 
            </div> 
        </>

}

export default TableHeader;