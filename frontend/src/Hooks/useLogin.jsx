import { useState } from "react"
import { useAuthContext } from "./useAuthContext"

const link = "https://jobfair-1.onrender.com"


export const useLogin = () => {
    const [ error, setError ] = useState(null);
    const [ isLoading, setIsLoading ] = useState(null)
    const { dispatch } = useAuthContext();

    const login = async (email, password) => {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`${link}/user/login`, {
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
            setIsLoading(false)
        }
    }


    return { login, isLoading, error };
}