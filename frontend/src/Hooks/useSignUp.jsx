import { useState } from "react";
import { useAuthContext } from "./useAuthContext";

const link = import.meta.env.VITE_API_URL || "http://localhost:2000";

const capitalize = (str) => {
    if(!str) return ""
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }



export const useSignUp = () => {
    const [ error, setError ] = useState(null);
    const [ isLoading, setIsLoading ] = useState(null)
    const { dispatch } = useAuthContext();

    const signup = async (email, password, fields, representitives, companyName, sector, city, noOfPositions, preferredMajors = [], opportunityTypes = [], preferredQualities = '') => {
        setIsLoading(true)
        setError(null);

        // Validate student preferences (required for companies)
        if (!preferredMajors || preferredMajors.length === 0) {
            setError("Please select at least one preferred major");
            setIsLoading(false);
            return false;
        }
        if (!opportunityTypes || opportunityTypes.length === 0) {
            setError("Please select at least one opportunity type");
            setIsLoading(false);
            return false;
        }
        if (!preferredQualities || preferredQualities.trim() === '') {
            setError("Please describe your ideal candidate qualities");
            setIsLoading(false);
            return false;
        }

        let capitalizedName = representitives.split(' ').map((word) => capitalize(word)).join(' ')

        const response = await fetch(`${link}/user/signup`, {
            method: "POST",
            headers: { "Content-Type" : "application/json" },
            body: JSON.stringify({email, password, fields, representitives: capitalizedName, companyName, sector, city, noOfPositions, preferredMajors, opportunityTypes, preferredQualities})
        })

        const json = await response.json();

        if(!response.ok){
            setError(json.error);
            setIsLoading(false)
        }
        if(response.ok){
            localStorage.setItem("user", JSON.stringify(json));
            dispatch({type: "LOGIN", payload: json})

            setIsLoading(false)
            return true;
        }
        return false;
    }


    return { signup, isLoading, error };
}