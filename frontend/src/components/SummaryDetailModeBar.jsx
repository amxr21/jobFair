import { ModeButton } from "./index"

const SummaryDetailModeBar = ({func, currentMode}) => {
    return (
        <div className="view-mode flex border-b">
          <ModeButton text='Summary' func={func} extraClasses={`${currentMode == "summary" ? "font-semibold" : ""}`} destination='summary' />
          <ModeButton text='Details' func={func} extraClasses={`${currentMode == "details" ? "font-semibold" : ""}`} destination='details' />
         </div>
    )
}


export default SummaryDetailModeBar