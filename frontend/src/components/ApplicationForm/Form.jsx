import axios from "axios";

import { useRef, createContext, useState, useContext } from "react";
import { PersonalInfo, ProfessionalInfo, SubmitFormBtn, ConfirmMessageDiv } from "./index";

const link = "https://jobfair-1.onrender.com"

import { useAuthContext } from "../../Hooks/useAuthContext"
import useFormContext from "../../Hooks/useFormContext";

import { FormContext } from "../../Context/FormContext";





const Form = () => {
    const { user } = useAuthContext();
    const confirmationMessageRef = useRef("");
    
    const [formDataReq, setFormDataReq] = useState({});
    const [qrCodeSrc, setQRCodeSrc] = useState(null);
    
    const FormProvider = ( {children} ) => {
    
        const { user } = useAuthContext()
    
        const form = useRef();
        const [formData, setFormData] = useState({});
        const [full, setFull] = useState(true);
        const updateFormData = (inputName, value) => {
            setFormData((prevData) => ( {...prevData, [inputName]: value} ) )
            // console.log(formData);
        }
    
    
        const handleSubmit = async (e) => {
            e.preventDefault()
            const formDataToSend = new FormData();
            console.log(formData);
    
    
            formDataToSend.append("uniId", formData["University ID"]);
            formDataToSend.append("fullName", formData["Full Name"]);
            formDataToSend.append("birthdate", formData["Date Of Birth"]);
            formDataToSend.append("gender", formData["Gender"]);
            formDataToSend.append("nationality", formData["Nationality"]);
            formDataToSend.append("studyLevel", formData["Study Program"]);
            formDataToSend.append("college", formData["College"]);
            formDataToSend.append("major", formData["Major"]);
            formDataToSend.append("email", formData["Email"]);
            formDataToSend.append("phoneNumber", formData["Phone number"]);
            formDataToSend.append("cgpa", formData["CGPA"]);
            formDataToSend.append("linkedIn", formData["LinkedIn URL"]);
            formDataToSend.append("skills", formData["Skills"]);
            formDataToSend.append("experience", formData["Experience"]);
            formDataToSend.append("cvfile", formData["CV"]);
            formDataToSend.append("portfolio", formData["Portfolio"]);
            //REVIEW IT LATER TO INLCUDE LANGUAGES LIST. REVIEW IT LATER TO INLCUDE LANGUAGES LIST.
            formDataToSend.append("languages", formData["languages"]);
            //REVIEW IT LATER TO INLCUDE LANGUAGES LIST. REVIEW IT LATER TO INLCUDE LANGUAGES LIST.
    
    
            // document.querySelectorAll("input").forEach((element) => {element.value =""})
            // try{
                if(Object.values(formData).length == 17){
                        // setFormDataReq(formDataToSend);
                        console.log("Application submitted successfully");
    
                        setFull(true);
    
                        e.preventDefault();
                        form.current.style.opacity = "0";
                        form.current.style.height = "fit-content";
                        setTimeout(()=>{form.current.style.display = "hidden";},500)
                        // document.getElementById("Form").classList.replace("opacity-0", "opacity-100")
                        // document.getElementById("Form").classList.replace("h-0", "h-fit");
        
                        // document.querySelector(".confirmMessageRef").current.classList.replace("hidden", "block")
                        document.querySelector(".confirmMessageRef").classList.replace("opacity-0", "opacity-1");
                        document.querySelector(".confirmMessageRef").classList.replace("h-0", "h-fit");
    
    
    
                        form.current.style.opacity = "0";
                        form.current.style.height = "fit-content";
                        setTimeout(()=>{form.current.style.display = "hidden";},500);
                        document.querySelector(".confirmMessageRef").classList.replace("opacity-0", "opacity-1");
                        document.querySelector(".confirmMessageRef").classList.replace("h-0", "h-fit");
    
    
                        let confirmationResponse;
                        if(!user?.token){
                            confirmationResponse = await axios.post(`${link}/applicants`, formDataToSend);
    
                        }
                        else{
                            confirmationResponse = await axios.post(`${link}/applicants`, formDataToSend,
                            {
                                headers: {
                                    Authorization: `Bearer ${user?.token}`
                                }
                            }
                    );}
    
                    // console.log(confirmationResponse, "\n\n\n\n-------------------------------\n\n\n\n");
                    console.log(confirmationResponse.data.applicantProfile._id);
                    setQRCodeSrc(confirmationResponse.data.applicantProfile._id);
                    if(!confirmationResponse){
                        console.log("QR code has not been generated");
                    }
                    }
    
                else{
                    setFull(false)
                    return;
                }
    
    
                confirmRegistration();
    
    
            // } catch(error){
                // console.log({error: error.message});
            // }
    
        }
    
    
    
        const confirmRegistration = async (e) => {
            e.preventDefault();
            form.current.style.opacity = "0";
            form.current.style.height = "fit-content";
            setTimeout(()=>{form.current.style.display = "none";},500)
            // document.getElementById("Form").classList.replace("opacity-0", "opacity-100")
            // document.getElementById("Form").classList.replace("h-0", "h-fit");
    
            // document.querySelector(".confirmMessageRef").current.classList.replace("hidden", "block")
            document.querySelector(".confirmMessageRef").classList.replace("opacity-0", "opacity-1")
            document.querySelector(".confirmMessageRef").classList.replace("h-0", "h-fit")
    
    
            // const confirmationResponse = await axios.post("http://localhost:2000/applicants/qr", formDataReq);
            // setQRCodeSrc(confirmationResponse.data);
            // console.log(confirmationResponse);
            // if(!confirmationResponse){
            //     console.log("QR code has not been generated");
            // }
    
        }
    
    
    
    
    
        return (
            <FormContext.Provider value={{formData, updateFormData}}>
                <form id="Form" ref={form} className="h-0 shadow-xl rounded-xl bg-white px-8 py-10 opacity-0 overflow-hidden">
                    {children}
                    {!full &&
                        <div className="border border-red-500 my-3 py-2 px-3 bg-red-200 rounded-md">
                            All fields are required
                        </div>
                    }
                    <button onClick={handleSubmit} id="submitForm" className="bg-blue-600 hover:bg-blue-800 text-white w-full px-2 py-3 rounded-xl ">Apply and get a chance to start your career !!</button>
                </form>
            </FormContext.Provider>
        )
    }

    
    return (
        <>
            <FormProvider>
                <PersonalInfo />
                <ProfessionalInfo />
                {/* <SubmitFormBtn /> */}

                {/*
                //this button will be responsible to hide the registration dialog and send registration confirmation message
                */}
                {/* <button onClick={confirmRegistration} className="bg-red-500">Test button</button> */}
                {/* <button onClick={()=>{document.getElementById("dialogg").showModal()}}>Hala</button> */}
                {/* <dialog id="dialogg" >
                    <h2>Congrats!</h2>
                    <h5>Your applicantion has been submitted, and it is gonna be reviewed by the authorized employee</h5>
                </dialog> */}
            </FormProvider>


            <ConfirmMessageDiv confirmMessageRef={confirmationMessageRef} qrCodeSrc={qrCodeSrc} />
        </>
    )
}

export default Form;