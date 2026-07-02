import { useState, createContext, useContext } from "react";


const FiltersContext = createContext()
const useFiltersContext = () => {
    const filtersContext = useContext(FiltersContext);
    if(!filtersContext){
        throw new Error("No filters context")
    }
    return filtersContext;
}


const FiltersProvider = ({children}) => {
    const [filter, setFilter] = useState("");
    const updateFilter = (filter) => {
        setFilter(filter);
    }


    return (
        <FiltersContext.Provider value={{filter, updateFilter}}>
            {children}
        </FiltersContext.Provider>
    )
}
export { FiltersContext, useFiltersContext, FiltersProvider }