import { useRef } from "react";

const ListHeader = ({headerText, type}) => {
    const expandOtherApplicantsIcon = useRef()

    const hanndleCollapse = (e) => {
        let othersList = e.target.parentElement.parentElement.parentElement.lastElementChild.firstElementChild

        if(othersList.classList.contains('expanded')){
            othersList.classList.replace('max-h-80', 'max-h-0') 
            othersList.classList.replace('pb-4', 'pb-0')
            othersList.classList.replace('pt-2', 'pt-0')
            othersList.classList.remove('expanded')
            expandOtherApplicantsIcon.current.classList.remove('rotate-180')
        }
        
        else{
            othersList.classList.add('expanded')
            othersList.classList.replace('max-h-0', 'max-h-80') 
            othersList.classList.replace('pb-0', 'pb-4')
            othersList.classList.replace('pt-0', 'pt-2')
            expandOtherApplicantsIcon.current.classList.add('rotate-180')
        }
        
    }



    return (
        <div className='flex justify-between p-4 border-b'>
            <h2 className="">{headerText}</h2>
            {
                type == 'other' &&
                <button className="flex items-center justify-center w-7 h-7" onClick={hanndleCollapse}>
                    <svg ref={expandOtherApplicantsIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="expandOtherApplicantsIcon w-full h-full p-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5" />
                    </svg>

                </button>
            }
            {/* <FilterApplicantsSelect /> */}
        </div>
    )
}


export default ListHeader;