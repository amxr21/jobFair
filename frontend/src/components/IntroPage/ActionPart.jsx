import { useRef } from "react"
import Arrow from "../../assets/images/arrow.svg"



const ActionPart = () => {

    const inroCover = useRef()

    const hideCover = () => {
        inroCover.current.parentElement.parentElement.parentElement.parentElement.style.height = 0;
        inroCover.current.parentElement.parentElement.parentElement.parentElement.style.padding = 0;
    }




    return (
        <div ref={inroCover} className="flex items-center gap-x-4">
            <div className="arrow">
                <img src={Arrow} alt="" />
            </div>
            <button onClick={hideCover} className="w-72 rounded-xl border p-2 text-xl">Get Started 🚀</button>
        </div>
    )
}

export default ActionPart;