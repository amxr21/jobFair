import { createContext, useEffect, useReducer } from "react";

export const AuthContext = createContext();

export const authReducer = (state, action) => {
    switch (action.type) {
        case "LOGIN":
            return { user: action.payload, isAuthLoading: false }
        case "LOGOUT":
            return { user: null, isAuthLoading: false }
        default:
            return state;
    }
}

export const AuthContextProvidor = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, {
        user: null,
        isAuthLoading: true,
    });

    useEffect(() => {
        try {
            const user = JSON.parse(localStorage.getItem("user"));
            dispatch({ type: "LOGIN", payload: user });
        } catch {
            dispatch({ type: "LOGIN", payload: null });
        }
    }, [])

    return (
        <AuthContext.Provider value={{ ...state, dispatch }}>
            {children}
        </AuthContext.Provider>
    )
}
