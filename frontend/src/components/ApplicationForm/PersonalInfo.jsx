import { Input, FormHeader, SelectInput } from "./index";
import { CountriesList, Colleges } from "./CountriesList";
import { useEffect, useRef, useState, useContext } from "react";

import useFormContext from "../../Hooks/useFormContext";


const PersonalInfo = () => {
    
    const {formData, updateFormData} = useFormContext();

    const major = useRef();
    const getCollegeOption = () => {
        updateFormData("College", college.current.value);
    }

    const getMajorOption = () => {
        updateFormData("Major", major.current.value);
    }






    const colleges = Object.keys(Colleges);
    const collegesObject = Colleges;



    const [a, setA] = useState([])
    const college = useRef()

    const specifyColleges = () => {
        setA([]);
        setA(collegesObject[college.current.value]);
    }


    let i = 0;
    return (
        <>
            <FormHeader header={"1. Personal Information"} />
            <div id="PersonalInfo" className="">
                <div className="flex md:flex-row flex-col gap-x-8">
                    <Input label={"University ID"} type={"text"} />
                    <Input label={"Full Name"} type={"text"} />
                </div>
                <div className="md:grid md:grid-cols-3 gap-x-8 gap-y-8 my-6">
                    <Input label={"Date Of Birth"} type={"date"} />
                    <SelectInput label={"Gender"} options={["Male", "Female"]} />
                    <SelectInput label={"Nationality"} options={CountriesList} />

                    <SelectInput label={"Study Program"} options={["Diploma", "Bachelor", "Master", "PhD"]} />


                    <div onChange={specifyColleges} className="flex flex-col grow">
                        <h2 className="text-lg mb-2">{"College"} :-</h2>
                        <select onChange={getCollegeOption} ref={college} className="bg-transparent border border-gray-700 rounded-lg py-1.5 px-2" name={"College"} id={"College"}>
                            <option className=""  defaultChecked> -- select a/an {"College"} -- </option>
                            {
                                colleges.map((option)=>{
                                    i++;
                                    return (
                                        <option key={i} className="my-2" value={option}>{option}</option>
                                    )
                                })
                            }
                        </select>
                    </div>

                    <div className="flex flex-col grow">
                        <h2 className="text-lg mb-2">{"Major"} :-</h2>
                        <select onChange={getMajorOption} ref={major} className="bg-transparent border border-gray-700 rounded-lg py-1.5 px-2" name={"Major"} id={"Major"}>
                            <option defaultChecked> -- select a/an {"Major"} -- </option>
                            {
                                a?.map((major)=>{
                                    i++;
                                    return (
                                        <option key={i} className="my-2" value={major}>{major}</option>
                                    )
                                })
                            }
                        </select>
                    </div>

                    {/* <SelectInput label={"College"} options={colleges} /> */}
                    {/* <SelectInput label={"Major"} options={a} /> */}



                    <Input label={"Email"} type={"email"} />
                    <Input label={"Phone number"} type={"number"} />
                    <Input label={"CGPA"} type={"number"} />


                </div>
            </div>
        </>
    )
}



export default PersonalInfo;