import SubmitLoading from "../assets/images/submitting.gif"

const SubmittingCover = () => {
    return (
        <div id="SubmitLoadingCover" className="w-[99%] absolute flex flex-col items-center justify-center p-8 bg-[#F3F6FF] flex w-full h-full top-0 left-[100%]  pointer-events-none z-[9999999] h-0 opacity-0">
            <img src={SubmitLoading} alt="" className="size-28" />
            <p className="text-lg font-light w-80 text-center">Hold on while we are processing your response</p>
        </div>
    )
}


export default SubmittingCover