import BarButtons from "./BarButtons";
import Attendance from "./Attendance";
import SimpleStatics from "./SimpleStatics";

const ControlBar = ({numberOfApplicants, attendancePercentageNum}) => {
    return (
        <div className="control-bar flex justify-between items-center bg-white h-fit rounded-lg px-4 my-3 py-4 shadow-2xl">
            <SimpleStatics number={numberOfApplicants}/>
            <Attendance attendancePercentage={attendancePercentageNum} />
            <BarButtons />
        </div>
    )
}

export default ControlBar;