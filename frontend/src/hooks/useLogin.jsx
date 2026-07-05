import { useState } from "react"
import { useAuthContext } from "./useAuthContext"
import { API_URL as link } from "../config/api";

export const useLogin = () => {
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(null)
    const { dispatch } = useAuthContext();

    const login = async (email, password) => {
        setIsLoading(true);
        setError(null);

        // The backend now resolves the authoritative company record itself
        // (including secondary/approved login emails) and returns its own
        // fields/representatives/companyName — no client-side pre-fetch
        // needed, and none would work correctly for a secondary email anyway
        // since it wouldn't match the primary `company.email` this used to
        // search by.
        const response = await fetch(`${link}/user/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
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