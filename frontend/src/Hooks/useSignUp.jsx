import { useState } from "react";
import { useAuthContext } from "./useAuthContext";
import QRCode from "qrcode.react";


// const link = "https://jobfair-7zaa.onrender.com"
const link = "http://localhost:2000"

const capitalize = (str) => {
    if(!str) return ""
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }



export const useSignUp = () => {
    const [ error, setError ] = useState(null);
    const [ isLoading, setIsLoading ] = useState(null)
    const { dispatch } = useAuthContext();
    const [ QRCodeSrc, setQRCodeSrc ] = useState("");

    const signup = async (email, password, fields, representitives, companyName, sector, city, noOfPositions) => {
        setIsLoading(true)
        setError(null);

        let capitalizedName = representitives.split(' ').map((word) => capitalize(word)).join(' ')

        const response = await fetch(`${link}/user/signup`, {
            method: "POST",
            headers: { "Content-Type" : "application/json" },
            body: JSON.stringify({email, password, fields, representitives: capitalizedName, companyName, sector, city, noOfPositions})
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