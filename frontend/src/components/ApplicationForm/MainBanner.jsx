import { useRef } from "react"


const MainBanner = () => {

    const startButton = useRef();

    const startForm = (e) => {
        startButton.current.parentElement.parentElement.classList.add("-mt-10");
        startButton.current.parentElement.parentElement.classList.add("opacity-0");

        document.getElementById("Form").classList.replace("opacity-0", "opacity-100")
        document.getElementById("Form").classList.replace("h-0", "h-fit");
        
        startButton.current.parentElement.parentElement.classList.replace("h-fit", "h-0")
        setTimeout(()=>{
            startButton.current.parentElement.parentElement.classList.add("hidden");
        },500)
    }


    return (
        <div id="Hero" className="md:w-8/12 md:mx-auto my-4 md:my-12 py-8 md:py-12 h-fit overflow-hidden">
            <div className="md:text-2xl md:text-left mb-4">
                <h2 className="md:text-6xl leading-[1.2em] text-7xl font-bold mb-4 md:mb-2">Hala Wallah</h2>
                <p className="text-2xl">Start filling your first Job Resume !!</p>
            </div>
            <div className="start-button flex md:mt-0 mt-12">
                <button ref={startButton} onClick={startForm} className="w-full py-4 px-3 border border-black rounded-xl text-3xl">Start</button>
            </div>
        </div>
    )
}

export default MainBanner;