import { createContext, useState } from "react";

const StatsticTypeContext = createContext()


const StatsticTypeProvider = ({children}) => {
    const [ statsticType, setStatsticType ] = useState('Applicants')

    const [ categoryType, setCategoryType ] = useState('cities')
    
    const updateFilter = (filter) => {
        setStatsticType(filter)
    }

    const updateCategory = (filter) => {
        setCategoryType(filter)
        console.log(filter);
        
    }

    return (
        <StatsticTypeContext.Provider value={{ statsticType, updateFilter, categoryType, updateCategory }}>
            {children}
        </StatsticTypeContext.Provider>
    )


}



export { StatsticTypeContext, StatsticTypeProvider }