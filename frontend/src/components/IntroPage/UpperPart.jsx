import Logos from "../IntroPage/Logos";
import Feb from "../../assets/images/FEB.svg";
import PeopleIllustration from "../IntroPage/PeopleIllustration";


const UpperPart = () => {
    return (
        <div className="upper-part flex justify-between h-[14em]">
            <div className="flex flex-col justify-between gap-4 w-[30em] h-full">
                <Logos/>
                <img src={Feb} alt="" className="w-full" />
            </div>
            <PeopleIllustration />
        </div>
    )
}

export default UpperPart;