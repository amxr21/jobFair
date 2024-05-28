import { Input, Language } from "./index";
import { useRef, useContext } from "react";
//REVIEW IT LATER TO CHECK IT INCLUDES LANGUAGES LIST. REVIEW IT LATER TO CHECK IT INCLUDES LANGUAGES LIST.
//REVIEW IT LATER TO CHECK IT INCLUDES LANGUAGES LIST. REVIEW IT LATER TO CHECK IT INCLUDES LANGUAGES LIST.
//REVIEW IT LATER TO CHECK IT INCLUDES LANGUAGES LIST. REVIEW IT LATER TO CHECK IT INCLUDES LANGUAGES LIST.

const Languages = () => {
    return (
        <div className="flex flex-col grow mb-4 md:my-0">
            <h2 className="text-md md:text-lg mb-2">Languages:-</h2>
            <div id="Languages" className="checkboxes flex flex-wrap justify-between mb-2">
                <Language lang={"Arabic"} />
                <Language lang={"English"} />
                <Language lang={"Other"} />
            </div>
            <Input label={"Others, if any:"} />
        </div>
    )
}


export default Languages;