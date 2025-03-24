import LowerPart from "../components/IntroPage/LowerPart";
import UpperPart from "../components/IntroPage/UpperPart";


const Intro = () => {
    return (
        <div id="intro" className="fixed p-[1.5rem] w-full h-[100vh] top-0 left-0 bg-white z-[999999] overflow-hidden">
            <div className="bg-[#0E7F41] px-16 py-14 h-full rounded-t-[4em] rounded-b-[2em] overflow-hidden">
                <UpperPart />

                <div className="line bg-red-500 w-full border-b my-12"></div>

                <LowerPart />


            </div>
        </div>
    )
}

export default Intro;