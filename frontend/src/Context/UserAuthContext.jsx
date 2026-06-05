import { createContext, useReducer } from "react";

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

// Read localStorage once, synchronously, as the initial state.
// This runs before the first render so isAuthLoading is never true
// and the AuthLoadingCover white flash never appears.
function getInitialState() {
    try {
        const user = JSON.parse(localStorage.getItem("user"));
        return { user: user || null, isAuthLoading: false };
    } catch {
        return { user: null, isAuthLoading: false };
    }
}

export const AuthContextProvidor = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, undefined, getInitialState);

    return (
        <AuthContext.Provider value={{ ...state, dispatch }}>
            {children}
        </AuthContext.Provider>
    )
}
