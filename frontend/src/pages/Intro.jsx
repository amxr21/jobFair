import LowerPart from "../components/IntroPage/LowerPart";
import UpperPart from "../components/IntroPage/UpperPart";


const Intro = () => {
    return (
        <div id="intro" className="fixed p-[1.5rem] w-full h-[100vh] top-0 start-0 bg-surface z-[999999] overflow-hidden">
            <div className="bg-primary px-16 py-14 h-full rounded-t-[4em] rounded-b-[2em] overflow-hidden">
                <UpperPart />

                <div className="line bg-red-500 w-full border-b my-12"></div>

                <LowerPart />


            </div>
        </div>
    )
}

export default Intro;