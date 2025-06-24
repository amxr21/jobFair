import { NextSectionIcon, PrevSectionIcon } from "./Icons";

const NextPrevCompanyButton = ({type="", handleClick }) => {
    return (
        <button onClick={handleClick} className={`min-w-10 min-h-10 p-3 border rounded-xl`}>
            {
                type == 'prev'
                ? <PrevSectionIcon />
                : <NextSectionIcon />
            }
        </button>
    )
}

export default NextPrevCompanyButton;