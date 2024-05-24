import { useState, createContext } from "react";

export const IdContext = createContext({inputValue: false, setInputValue: () => {}})

export const IdProvider = ({children}) => {
    const [ inputValue, setInputValue ] = useState(false);

    return (
        <IdContext.Provider value={{ inputValue: inputValue, setInputValue: setInputValue }}>
            {children}
        </IdContext.Provider>
    )
}


export default {IdContext, IdProvider}