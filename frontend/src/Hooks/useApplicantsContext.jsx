import { useContext } from "react";
import { ApplicantsContext } from "../Context/ApplicantsContext";

export const useApplicantsContext = () => {
    const context = useContext(ApplicantsContext);

    if(!context) throw Error("useApplicantsContext must be used within the ApplicantsContext Providor");

    return context;

}