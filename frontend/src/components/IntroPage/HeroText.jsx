import ActionPart from "./ActionPart"
import HeaderSub from "./HeaderSub"

const HeroText = () => {
    return (
        <div className=" w-[70%] text-white flex flex-col justify-between">
            <div className="flex flex-col gap-y-6s">
                <HeaderSub />
                <p className="font-thin text-xl text-justify">
                Connect with leading companies, showcase your skills, and find your dream job in one place.
                </p>
            </div>
            <ActionPart />
        </div>
    )
}

export default HeroText