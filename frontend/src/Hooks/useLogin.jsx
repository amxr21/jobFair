import { useState } from "react"
import { useAuthContext } from "./useAuthContext"
import axios from "axios";

const link = "https://jobfair-7zaa.onrender.com"


export const useLogin = () => {
    const [ error, setError ] = useState(null);
    const [ isLoading, setIsLoading ] = useState(null)
    const { dispatch } = useAuthContext();

    const [selected, setSelected] = useState(null)

    const [fields, setFields] = useState('')
    const [representitives, setRepresentitives] = useState('')
    const [companyName, setCompanyName] = useState('')

    const login = async (email, password) => {
        setIsLoading(true);
        setError(null);
        
        let selected = null;
        let fields = "";
        let representitives = "";
        let companyName = "";


        
        
        try {
            console.log("Logging in with:", { email, password, fields, representitives, companyName });
            const response = await axios.get(`${link}/companies`);
            const companies = response.data;
            
            const selected = companies.find(company => company.email?.trim() === email?.trim());
          
            if (selected) {
              fields = selected.fields;
              representitives = selected.representitives;
              companyName = selected.companyName;
            }
          } catch (err) {
            console.error("Error fetching companies:", err);
          }




        setIsLoading(true);
        setError(null);


        
        const response = await fetch(`${link}/user/login`, {
            method: "POST",
            headers: { "Content-Type" : "application/json" },
            body: JSON.stringify({email, password, fields, representitives, companyName})
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