import { NextPrevCompanyButton } from "./index";

const CurrentCompanyBar = ({CompanyName, func, length}) => {
    const handleClick = (type) => {
        if(type == 'next'){
            func((p) => {
                if(p + 1 < length){
                    return p + 1
                }
                else{
                    return 0
                }
            })
        }
        else{
            func((p) => {
                if(p - 1 >= 0){
                    return p - 1
                }
                else{
                    return length - 1
                }
            })
        }
    } 



    return (
        <div className="bg-white flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-4">
                <div className="buttons flex gap-2">
                    <NextPrevCompanyButton handleClick={() => {handleClick('prev')}} type="prev" />
                    <NextPrevCompanyButton handleClick={() => {handleClick('next')}} type="next" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Company Response</span>
                    <h2 className="text-lg font-semibold">{CompanyName}</h2>
                </div>
            </div>
        </div>
    )
}

export default CurrentCompanyBar;