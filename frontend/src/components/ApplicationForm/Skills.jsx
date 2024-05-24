import useFormContext from "../../Hooks/useFormContext";
import { useRef, useContext } from "react";

const Skills = ({label}) => {
    const message = useRef();

    const {formData, updateFormData} = useFormContext();
    const getOption = () => {
        updateFormData(label, message.current.value);
    }


    return (
        <div id="Skills" className="flex flex-col">
            {/* <h2 className="text-lg mb-2">A message to the employer:-</h2> */}
            <label className="text-lg mb-2" htmlFor="Skills">{label}:-</label>
            <textarea onChange={getOption} ref={message} name="Skills" id="Skills" className="flex grow bg-transparent border border-gray-700 rounded-lg py-1.5 px-2" ></textarea>
        </div>
    )
}


export default Skills;