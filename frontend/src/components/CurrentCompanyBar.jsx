import { NextPrevCompanyButton } from "./index";

const CurrentCompanyBar = ({CompanyName, func, length}) => {
    console.log(length);
    

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
        <div className="flex items-center gap-5 p-4 rounded-xl border mb-5">
            <div className="buttons flex gap-2">
                <NextPrevCompanyButton handleClick={() => {handleClick('prev')}} type="prev" />
                <NextPrevCompanyButton handleClick={() => {handleClick('next')}} type="next" />
            </div>
            <h2 className="text-xl">{CompanyName}</h2>
        </div>
    )
}

export default CurrentCompanyBar;