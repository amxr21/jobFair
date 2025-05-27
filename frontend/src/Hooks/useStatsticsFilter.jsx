import { useContext } from "react";
import { StatsticTypeContext } from "../Context/StatsticTypeContext"

const useStatsticsFilter =  () => {
    const statsticTypeContext = useContext(StatsticTypeContext);

    if(!statsticTypeContext){
        throw new Error("No filters context")
    }

    
    return statsticTypeContext;
}



export default useStatsticsFilter