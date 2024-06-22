import { useRef } from "react"


const MainBanner = () => {

    const startButton = useRef();

    const startForm = (e) => {
        startButton.current.parentElement.parentElement.classList.add("-mt-10");
        startButton.current.parentElement.parentElement.classList.add("opacity-0");

        document.getElementById("Form").classList.replace("opacity-0", "opacity-100")
        document.getElementById("Form").classList.replace("h-0", "md:h-fit");
        document.getElementById("Form").classList.add("h-[36em]");
        
        startButton.current.parentElement.parentElement.classList.replace("h-fit", "h-0");
        startButton.current.parentElement.parentElement.classList.add("overflow-hidden");
        setTimeout(()=>{
            startButton.current.parentElement.parentElement.classList.add("hidden");
        },500)
    }


    return (
        <div id="Hero" className="bg- md:w-full md:mx-0 my-4 md:my-12 py-8 md:py-12 h-fit overflow-hidden">
            <div className="md:text-2xl md:text-left mb-4">
                <h2 className="md:text-5xl leading-[1.2em] text-4xl font-bold mb-4 md:mb-2 uppercase">Welcome to your first Job Fair!</h2>
                <p className="md:text-3xl text-md text-justify">Connect with top employers, discover exciting career opportunities, and take the next step in your professional journey</p>
            </div>
            <div className="start-button flex md:mt-10 mt-8">
                <button ref={startButton} onClick={startForm} className="w-full w-1/2 md:w-4/12 md:py-4 py-2 px-1 md:px-3 border border-black rounded-lg text-lg md:text-2xl">Lets Start</button>
            </div>
        </div>
    )
}

export default MainBanner;