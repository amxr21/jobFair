import useFormContext from "../../Hooks/useFormContext";
import { useRef, useContext } from "react";


const Language = ({lang}) => {
    const refLabel = useRef();

    const { formData, updateFormData } = useFormContext();
    const getLang = () => {
        // console.log([...document.getElementById("Languages").childNodes]);
        updateFormData("languages", [...document.getElementById("Languages").childNodes].filter((checkbx)=> checkbx.firstChild.checked).map((html) => html.textContent));

    }



    return (
        <div className="checkbox flex items-center mr-14">
            <input ref={refLabel} onChange={getLang} type="checkbox" name={lang} id={lang} className="w-5 h-5 mr-2 z-50 bg-transparent"/>
            <label htmlFor={lang} className="text-lg">{lang}</label>
        </div>
    )
}

export default Language;