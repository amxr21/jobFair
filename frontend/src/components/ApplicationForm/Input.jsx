import { Form } from "./index";
import { useRef } from "react";

import useFormContext from "../../Hooks/useFormContext";

const Input = ({label, type, name}) => {
    const refLabel = useRef();

    const { formData, updateFormData } = useFormContext();
    const getInput = () => {
        updateFormData(label, refLabel.current.value);
    }




    let max = 10000000000000;
    if(label == "CGPA") {
        max = 4.00
    }





    return (
        <div className="flex flex-col grow">
            <h2 className="text-lg mb-2">{label} :-</h2>
            <input ref={refLabel} onChange={getInput} type={type} name={name} className="bg-transparent border border-gray-700 rounded-lg py-1.5 px-2" placeholder={label} max={max} />
        </div>
    )
}


export default Input;