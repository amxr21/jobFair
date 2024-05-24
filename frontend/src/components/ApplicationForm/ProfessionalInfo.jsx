import { useState } from "react";

import { FormHeader, Input, Languages, Skills } from "./index";
import useFormContext from "../../Hooks/useFormContext";


const ProfessionalInfo = () => {
    const [cv, setCV] = useState(null);

    const { formData, updateFormData } = useFormContext();




    const uploadCV = (e) => {
        setCV(e.target.files[0]);
        updateFormData("CV", e.target.files[0]);
        console.log("File uploaded successfully ");
        console.log(e.target.files[0]);
    }



    return(
        <>
            <FormHeader header={"2. Professional Information"} />
            <div id="ProfessionalInfo" className="md:grid md:grid-cols-2 gap-x-8 gap-y-8 my-6">
                    <Input label={"LinkedIn URL"} type={"text"} />
                    <Input label={"Skills"} type={"text"} />
                    <Languages />
                    <Skills label={"Experience"}/>
                    <div className="flex flex-col grow">
                        <h2 className="text-lg mb-2">CV:-</h2>
                        <input id="CV" onChange={uploadCV} type="file" name="cvfile" className="bg-transparent border border-gray-700 rounded-lg py-1.5 px-2" />
                    </div>
                    <Input name={"Portfolio"} label={"Portfolio"} type={"text"} />
            </div> 
        </>
    )
}


export default ProfessionalInfo;