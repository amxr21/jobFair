import { useContext } from "react";

import { FormContext } from "../Context/FormContext";

const useFormContext = () => {
    const context = useContext(FormContext);
    if(!context) {
        throw new Error("Must be within the context tree")
    }
    return context;
}


export default useFormContext;