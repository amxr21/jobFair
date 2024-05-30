import { createContext, useReducer } from "react";

export const ApplicantsContext = createContext();

export const applicantsReducer = (state, action) => {
    switch(action.type) {
        case "SET_APPLICANTS":
            return {
                applicants: action.payload;
            }
        case "ADD_APPLICANT":
            return {
                applicants: [action.payload, ...state.applicants];
            }

        default:
            return state;
    }
}


export const ApplicantsContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(applicantsReducer, {
        applicants: null
    })
    



    return (
        <ApplicantsContext.Provider value={{state, dispatch}}>
            {children}
        </ApplicantsContext.Provider>
    )
}