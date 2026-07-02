import { useState } from "react"
import { useAuthContext } from "./useAuthContext"
import axios from "axios";
import { API_URL as link } from "../config/api";

export const useLogin = () => {
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(null)
    const { dispatch } = useAuthContext();

    const login = async (email, password) => {
        setIsLoading(true);
        setError(null);

        let fields = "";
        let representatives = "";
        let companyName = "";

        try {
            const response = await axios.get(`${link}/companies`);
            const companies = response.data;
            const selected = companies.find(company => company.email?.trim() === email?.trim());

            if (selected) {
                fields = selected.fields;
                representatives = selected.representitives;
                companyName = selected.companyName;
            }
        } catch (err) {
            // Continue with login even if company fetch fails
        }

        const response = await fetch(`${link}/user/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, fields, representitives: representatives, companyName })
        })

        const json = await response.json();

        if (!response.ok) {
            setError(json.error);
            setIsLoading(false)
            return false;
        }
        if (response.ok) {
            localStorage.setItem("user", JSON.stringify(json));
            dispatch({ type: "LOGIN", payload: json })
            setIsLoading(false)
            return true;
        }
        return false;
    }

    return { login, isLoading, error };
}