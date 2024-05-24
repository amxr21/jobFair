import { useState, useRef, useContext, useEffect } from "react"

import { IdContext } from "../../Context/IdContext"

import axios from "axios";

const CheckId = ({value}) => {
    const checkIdDiv = useRef();

    const { inputValue, setInputValue } = useContext(IdContext);
    
    const [ inputId, setInputId ] = useState("");
    const [ error, setError ] = useState(false);


    const getA = async () => {
        if(value){
            checkIdDiv.current.classList.replace("mt-0", "-mt-48")
            console.log(checkIdDiv.current,checkIdDiv.current.classList);
        }
        try{
            const response = await axios.get("https://jobfair-1.onrender.com/applicants/"+checkIdDiv.current.children[1].value)
            console.log(inputValue);
            if(response && response.data.applicantDetails){
                setInputValue(true);
                console.log(response.data);
                console.log(inputValue);
                inputValue
                ? checkIdDiv.current.classList.replace("mt-0", "-mt-48")
                : checkIdDiv.current.classList.replace("mt-0", "mt-0")
            }
        }
        catch(error){
            console.log(inputValue);
            setInputValue(false);
            setError(true)
        }
    }

    useEffect(() => {
        if( inputId != "") getA()
    }, [inputValue])



    return (
        <div ref={checkIdDiv} className="flex flex-col relative items-end my-7 py-4 mt-0">
            <label htmlFor="applicantId" className="mb-2 text-xl w-full">Applicant id:</label>
            <input onChange={() => {setInputId(checkIdDiv.current.children[1].value);}} type="text" name="applicantId" placeholder="e.g. fd8s941dsf44errf" id="applicantId" className="w-full py-2 px-2 border rounded-md"/>
            {!inputValue && inputId != "" && error &&
                <div className="error bg-red-200 border border-red-500 text-red-800 rounded-lg px-2 w-full py-2 my-2">No such an id</div>
            }
            <button type="submit" onClick={getA} className="z-50 w-fit rounded-md my-2 px-3 py-2 border bg-green-700 text-white">Search</button>
        </div>
    )
}

export default CheckId;