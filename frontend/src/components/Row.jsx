import axios from "axios"
import { useRef, useState, useEffect } from "react";
import EmailToSection from "./EmailToSection";
import BriefInfo from "./BriefInfo";
import PersonalPhoto from "./PersonalPhoto";
import Brief from "./Brief";
import CardRow from "./CardRow";
import CardInfo from "./CardInfo";
import CardInfo2 from "./CardInfo2";;
import CardInfoFile from "./CardInfoFile";



import { ExpandIcon } from "./Icons";
 

// const colorCode = {
//     confirmed: {active: '#0066CC', off: '#E5F0FF'},
//     registerd: {active: '#0E7F41', off: '#E5FFE5'},
//     pending: {active: '#EBC600', off: '#FFFACD'},
//     canceled: {active: '#CC0000', off: '#FFE5E5'},
// } 

const colorCode = {
    Confirmed: 'bg-[#E5F0FF] text-[#0066CC]',
    Registered: 'bg-[#E5FFE5] text-[#0E7F41]',
    Pending: 'bg-[#FFFACD] text-[#EBC600]',
    Canceled: 'bg-[#FFE5E5] text-[#CC0000]',
}



const Row = ({number, name, ticketId, uniId, email, phoneNumber, studyLevel, major, gpa, nationality, experience, attended, age, portfolio, languages, file, qrCode, status='Registered', userType, companyName, companyEmail, companyRepresentitives, companyFields, companyStatus, numebrOfApplicants, companySector, companyCity, numberOfPositions, skills, city, expectedToGraduate, flags, user}) => {
    const expandApplicantDiv = useRef();
    const expandApplicantBtn = useRef();
    const [isVisible, setIsVisible] = useState(false);

    const [ isClicked, setIsClicked ] = useState(false)


    useEffect(() => {
        if (expandApplicantDiv.current && isClicked) {
            setIsVisible(true); // Use state to handle visibility
        }
 
    }, [isClicked])


    useEffect(() => {
        // function getAllDescendants(element, descendantsList) {
        //     if (!element) return;
            
        //     const children = element.children;
        //     for (let i = 0; i < children.length; i++) {
        //         descendantsList.push(children[i]);
        //         getAllDescendants(children[i], descendantsList);
        //     }
        // }
        // function getAllDescendants(element, descendantsList) {
        //     if (!element) return;
        
        //     const walker = document.createTreeWalker(
        //         element,
        //         NodeFilter.SHOW_ELEMENT,
        //         null,
        //         false
        //     );
        
        //     let currentNode = walker.currentNode;
        
        //     while (currentNode) {
        //         descendantsList.push(currentNode);
        //         currentNode = walker.nextNode();
        //     }
        // }
        
        const handleClickOutside = (e) => {
            const dropdown = expandApplicantDiv.current;
            const trigger = expandApplicantBtn.current;

            const flagButton = document.getElementById('FlagCheckboxContainer')
            

            // console.log('====================================');
            // console.log(e.target);
            // console.log('====================================');
            if (
                dropdown &&
                !dropdown.contains(e.target) &&
                trigger &&
                !trigger.contains(e.target)
            ) {
                setIsVisible(false);
                setIsClicked(false);
            }
        };
    
        window.addEventListener("click", handleClickOutside);

        return () => {
            window.removeEventListener("click", handleClickOutside);
        };
    }, []);


    if(email == 'casto@sharjah.ac.ae'){ number -= 1; return '';}
    else{
        return userType != 'manager'
        ?
            <div className={`row grid py-4 pl-7 pr-14 min-h-24 ${flags?.includes(user?.companyName) ? "border border-2 border-green-500 bg-white" :'bg-white'} rounded-xl items-center mb-2 text-sm xl:text-base`}>
                <h2 className="flex">{number}
                    
                </h2>
                <h2 className="flex">{name}</h2>
                <h2 className="flex">{uniId == "" || uniId?.length != 8 || uniId == 18000000 ? '00000000' : uniId}</h2>
                <h2 className="flex">{nationality}</h2>
                {/* <h2 className="flex">{age}</h2> */}
                <h2 className="flex">{gpa == 0 || Number.isNaN(gpa)  ? 'XX' : parseFloat(gpa)?.toFixed(2)}</h2>
                <div className=" ">
                    <span>{studyLevel?.startsWith('Master') ? "" : studyLevel}</span>
                    <span>{studyLevel?.startsWith('Master') ? "" : ' of'} {major}</span>
                </div>
                <h2 className={`flex text-center justify-center text-sm xl:text-[1rem] px-2 py-2 rounded-xl font-semibold ${status ? `${colorCode.Confirmed}` : `${colorCode.Registered}`}`}>{status ? 'Confirmed' : 'Registered'}</h2>
    
               
               
               
               
               
                <div className="relative flex justify-end">
                    <button className="flex items-center justify-center w-7 h-7" ref={expandApplicantBtn} onClick={() => {setIsClicked(true)}}>
                        <ExpandIcon />
                    </button>
                    
                    
                    
                    
                    
                    <div ref={expandApplicantDiv} className={`expandDetails parent bg-white shadow-2xl rounded-xl px-8 py-10 w-80 md:w-[64rem] h-[36rem] max-h-[40rem] overflow-y-scroll md:overflow-y-auto fixed top-[48%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${isVisible ? 'opacity-100 z-[99999]' : 'opacity-0 -z-[9999]'}`}>
                        <div className="card-info flex flex-col md:flex-row gap-x-4 md:h-11/12">
                            <Brief>
                                <BriefInfo
                                    ticketId={ticketId}
                                    id={uniId}
                                    shortName={name}
                                    ticketQrCodeSrc={qrCode}
                                    emailRec = {email}
                                    status={status}
                                    graduationYear={expectedToGraduate}
                                    flag={flags}
                                />
                            </Brief>
                            <div className="details md:w-8/12 flex flex-col gap-3">
                                <CardRow>
                                    <CardInfo
                                        infoHeader={"Full name"}
                                        infoText={name}
                                    />
                                    <CardInfo
                                        infoHeader={"University ID"}
                                        infoText={uniId}
                                    />
                                    <CardInfo
                                        infoHeader={"Age"}
                                        infoText={age}
                                    /> 
                                </CardRow>
    
                                <CardRow>
                                    <CardInfo
                                        infoHeader={"Email"}
                                        infoText={email}
                                    />
                                    <CardInfo
                                        infoHeader={"Phone number"}
                                        infoText={phoneNumber}
                                    />
                                </CardRow>
    
                                <CardRow>
                                    <CardInfo
                                        infoHeader={"Study program"}
                                        infoText={studyLevel}
                                    />
                                    <CardInfo
                                        infoHeader={"Major"}
                                        infoText={major}
                                    />
                                    <CardInfo
                                        infoHeader={"CGPA"}
                                        infoText={gpa ? parseFloat(gpa).toFixed(2) : ''}
                                    />
                                </CardRow>
                                
                                <CardRow>
                                    <CardInfo
                                        infoHeader={"Technical Skills"}
                                        infoText={skills?.tech}
                                    />
                                    <CardInfo
                                        infoHeader={"Not-technical Skills"}
                                        infoText={skills?.nontech}
                                    />
                                </CardRow>

                                <CardRow>
                                    <CardInfo
                                        infoHeader={"Nationality"}
                                        infoText={nationality}
                                    />
                                    <CardInfo
                                        infoHeader={"Languages"}
                                        infoText={languages}
                                    />
                                    <CardInfo
                                        infoHeader={"City"}
                                        infoText={city}
                                    />
                                </CardRow>

                                <CardRow>
                                    <CardInfo
                                        infoHeader={"Experience"}
                                        infoText={experience}
                                    />

                                </CardRow>

    
    
                                <CardRow>
                                    <CardInfo
                                        infoHeader={"LinkedIn"}
                                        infoText={portfolio}
                                    />
    
    
    
                                    <CardInfoFile file={file} />
    
    
    
    
    
                                </CardRow>
                            </div>
                        </div>
                        {/* <hr className="my-4" /> */}
                        {/* <EmailToSection /> */}
                    </div>
    
    
    
                    
                </div>
            </div>
        :
            <div className="row-manager grid py-4 px-7 min-h-24 bg-white rounded-xl gap-x-4 items-center mb-2 text-sm xl:text-base">
                <h2 className="flex">{number}</h2>
                <h2 className="flex">{companyName}</h2>
                <h2 className="max-w-xs break-words whitespace-normal overflow-hidden text-wrap">
                    <a href={`mailto:${companyEmail}`}>{companyEmail}</a>
                </h2>
                <h2 className="flex">{companyRepresentitives}</h2>
                <h2 className="flex">{companyCity}</h2>
                <h2 className="flex">{companySector}</h2>
                {/* <h2 className="flex">{companyFields?.toLowerCase()}</h2> */}
                <h2 className="flex">{numebrOfApplicants}</h2>
                <h2 className={`flex justify-center text-sm xl:text-[1rem] p-2 rounded-xl font-semibold ${companyStatus == 'Confirmed' ? `${colorCode.Confirmed}` : `${colorCode.Canceled}]`}`}>{companyStatus == 'Confirmed' ? 'Confirmed' : 'Canceled'}</h2>
    
               
               
               
               
               
                {/* <div className="relative">
                    <button className="flex items-center justify-center w-7 h-7 " aria-label="Expand" ref={expandApplicantBtn} onClick={expandApplicant}>
                        <ExpandIcon />.
                    </button>
                    
                    
                    
                    
                    
                    <div ref={expandApplicantDiv} className={`parent bg-white shadow-2xl rounded-xl px-8 py-10 w-80 md:w-[56em] md:max-w-[196em] h-[50em] overflow-y-scroll md:overflow-hidden md:h-fit fixed top-[50%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${isVisible ? 'opacity-100 z-[99999]' : 'opacity-0 -z-[9999]'}`}>
                        <div className="card-info flex flex-col md:flex-row gap-x-4 md:h-11/12">
                            <Brief>
                                <BriefInfo
                                    ticketId={ticketId}
                                    id={uniId}
                                    shortName={`${String(name).split(" ")[0]} ${String(name).split(" ")[String(name).split(" ").length-1]}`}
                                    ticketQrCodeSrc={qrCode}
                                    emailRec = {email}
                                />
                            </Brief>
                            <div className="details md:w-8/12">
                                <CardRow>
                                    <CardInfo
                                        infoHeader={"Full name:"}
                                        infoText={name}
                                    />
                                    <CardInfo
                                        infoHeader={"University ID:"}
                                        infoText={uniId}
                                    />
                                </CardRow>
    
                                <CardRow>
                                    <CardInfo
                                        infoHeader={"Email:"}
                                        infoText={email}
                                    />
                                    <CardInfo
                                        infoHeader={"Phone number:"}
                                        infoText={phoneNumber}
                                    />
                                    <CardInfo
                                        infoHeader={"Age:"}
                                        infoText={age}
                                    />
                                </CardRow>
    
                                <CardRow>
                                    <CardInfo2
                                        infoHeader={"Study program:"}
                                        infoText={studyLevel}
                                    />
                                    <CardInfo2
                                        infoHeader={"Major:"}
                                        infoText={major}
                                    />
                                    <CardInfo2
                                        infoHeader={"CGPA:"}
                                        infoText={gpa}
                                    />
                                </CardRow>
    
                                <CardRow>
                                    <CardInfo2
                                        infoHeader={"Nationality:"}
                                        infoText={nationality}
                                    />
                                    <CardInfo2
                                        infoHeader={"Experience:"}
                                        infoText={experience}
                                    />
                                    <CardInfo2
                                        infoHeader={"Attended:"}
                                        infoText={attended}
                                    />
                                </CardRow>
    
                                <CardRow>
                                    <CardInfo2
                                        infoHeader={"Languages:"}
                                        infoText={languages}
                                    />
                                    <CardInfo2
                                        infoHeader={"Portfolio:"}
                                        infoText={portfolio}
                                    />
    
    
    
                                    <CardInfoFile file={file} />
    
    
    
    
    
                                </CardRow>
                            </div>
                        </div>
                        <hr className="my-4" />
                        <EmailToSection />
                    </div> 
    
                </div> */}






            </div>
        
    }

}

export default Row;
