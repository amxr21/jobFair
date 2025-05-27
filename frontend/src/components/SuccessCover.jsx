import { ResponseOkIcon } from "./Icons"


const SuccessCover = () => {
    return (
        <div id="Success" className="absolute flex flex-col items-center justify-center gap-2 p-8 bg-[#F3F6FF] w-full top-0 left-[100%]  pointer-events-none z-[9999999] cursor-default h-0 opacity-0">
            <ResponseOkIcon />
            <p className="text-lg font-normal text-center w-[28rem]">Your response has been Submitted. You will be directed in few seconds...</p>

        </div>
    )
}

export default SuccessCover