import { useState } from "react";
import { useAuthContext } from "./useAuthContext";
import QRCode from "qrcode.react";

export const useSignUp = () => {
    const [ error, setError ] = useState(null);
    const [ isLoading, setIsLoading ] = useState(null)
    const { dispatch } = useAuthContext();
    const [ QRCodeSrc, setQRCodeSrc ] = useState("");

    const signup = async (email, password) => {
        setIsLoading(true)
        setError(null);
        const response = await fetch(`${link}/user/signup`, {
            method: "POST",
            headers: { "Content-Type" : "application/json" },
            body: JSON.stringify({email, password})
        })

        const json = await response.json();

        if(!response.ok){
            setError(json.error);
            setIsLoading(false)
        }
        if(response.ok){
            localStorage.setItem("user", JSON.stringify(json));
            dispatch({type: "LOGIN", payload: json})
            
            //generate a QR code for each company once it signs up and account is create
            setQRCodeSrc(json.user_id);
            

            setIsLoading(false)
        }
    }


    return { signup, isLoading, error };
}