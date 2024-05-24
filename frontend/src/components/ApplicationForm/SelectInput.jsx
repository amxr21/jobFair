import useFormContext from "../../Hooks/useFormContext"

import { useRef, useContext } from "react";


const SelectInput = ({ label, options }) => {
    const refSelect = useRef();

    const {formData, updateFormData} = useFormContext();
    const getOption = () => {
        updateFormData(label, refSelect.current.value);
    }


    let i = 0;
    return (
        <div className="flex flex-col grow">
            <h2 className="text-lg mb-2">{label} :-</h2>
            <select onClick={getOption} ref={refSelect} className="bg-transparent border border-gray-700 rounded-lg py-1.5 px-2" name={label} id={label}>
            <option defaultChecked> -- select a {label} -- </option>
                {
                    options.map((option)=>{
                        i++;
                        return (
                            <option key={i} className="my-2" value={option}>{option}</option>
                        )
                    })
                }
            </select>
        </div>
    )
}

export default SelectInput;