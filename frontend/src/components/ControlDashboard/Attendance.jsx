
const Attendance = ({attendancePercentage}) => {
    return (
        <div className="filters flex items-center">
            <h4 className="mr-4 h-fit">Percentage of attendance: </h4>
            <div className="filter-options flex">
                {/* <FilterInput label={"GPA"} />
                <FilterInput label={"Major"} />
                <FilterInput label={"Recent"} /> */}
                <div className="text-3xl">{attendancePercentage}</div>
            </div>
        </div>
    )
}

export default Attendance;