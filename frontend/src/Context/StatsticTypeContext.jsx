import { createContext, useState } from "react";

const StatsticTypeContext = createContext()


const StatsticTypeProvider = ({children}) => {
    const [ statsticType, setStatsticType ] = useState('')

    
    const updateFilter = (filter) => {
        setStatsticType(filter)
    }

    return (
        <StatsticTypeContext.Provider value={{ statsticType, updateFilter }}>
            {children}
        </StatsticTypeContext.Provider>
    )


}



export { StatsticTypeContext, StatsticTypeProvider }