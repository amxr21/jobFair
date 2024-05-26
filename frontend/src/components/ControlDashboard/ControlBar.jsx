import BarButtons from "./BarButtons";
import Attendance from "./Attendance";
import SimpleStatics from "./SimpleStatics";

const ControlBar = ({numberOfApplicants, attendancePercentageNum}) => {
    return (
        <div className="control-bar flex flex-col gap-y-3 md:gap-y-0 md:flex-row justify-between items-center bg-white h-fit rounded-lg px-4 my-3 py-4 shadow-2xl text-sm md:text-md">
            <SimpleStatics number={numberOfApplicants}/>
            <Attendance attendancePercentage={attendancePercentageNum} />
            <BarButtons />
        </div>
    )
}

export default ControlBar;