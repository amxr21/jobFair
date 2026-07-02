import { useContext } from "react";
import { StatsticTypeContext } from "../context/StatsticTypeContext"

const useStatsticsFilter =  () => {
    const statsticTypeContext = useContext(StatsticTypeContext);

    if(!statsticTypeContext){
        throw new Error("No filters context")
    }

    
    return statsticTypeContext;
}



export default useStatsticsFilter