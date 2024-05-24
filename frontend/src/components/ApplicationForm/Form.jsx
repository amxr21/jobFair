import axios from "axios";

import { useRef, createContext, useState, useContext } from "react";
import { PersonalInfo, ProfessionalInfo, SubmitFormBtn, ConfirmMessageDiv } from "./index";


import { useAuthContext } from "../../Hooks/useAuthContext"
import useFormContext from "../../Hooks/useFormContext";

import { FormProvider, FormContext } from "../../Context/FormContext";

const Form = () => {
    const { user } = useAuthContext();
    const confirmationMessageRef = useRef("");

    const [formDataReq, setFormDataReq] = useState({});
    const [qrCodeSrc, setQRCodeSrc] = useState(null);


    const confirmRegistration = async (e) => {
        e.preventDefault();
        form.current.style.opacity = "0";
        form.current.style.height = "fit-content";
        setTimeout(()=>{form.current.style.display = "none";},500)
        // document.getElementById("Form").classList.replace("opacity-0", "opacity-100")
        // document.getElementById("Form").classList.replace("h-0", "h-fit");

        // confirmationMessageRef.current.classList.replace("hidden", "block")
        confirmationMessageRef.current.classList.replace("opacity-0", "opacity-1")
        confirmationMessageRef.current.classList.replace("h-0", "h-fit")


        // const confirmationResponse = await axios.post("http://localhost:2000/applicants/qr", formDataReq);
        // setQRCodeSrc(confirmationResponse.data);
        // console.log(confirmationResponse);
        // if(!confirmationResponse){
        //     console.log("QR code has not been generated");
        // }

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