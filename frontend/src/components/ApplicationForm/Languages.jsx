import { Input, Language } from "./index";
import { useRef, useContext } from "react";
//REVIEW IT LATER TO CHECK IT INCLUDES LANGUAGES LIST. REVIEW IT LATER TO CHECK IT INCLUDES LANGUAGES LIST.
//REVIEW IT LATER TO CHECK IT INCLUDES LANGUAGES LIST. REVIEW IT LATER TO CHECK IT INCLUDES LANGUAGES LIST.
//REVIEW IT LATER TO CHECK IT INCLUDES LANGUAGES LIST. REVIEW IT LATER TO CHECK IT INCLUDES LANGUAGES LIST.

const Languages = () => {
    return (
        <div className="flex flex-col">
            <h2 className="text-lg mb-2">Languages:-</h2>
            <div id="Languages" className="checkboxes flex ">
                <Language lang={"Arabic"} />
                <Language lang={"English"} />
                <Language lang={"Other"} />
            </div>
            <Input label={"Others, if any:"} />
        </div>
    )
}


export default Languages;