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

const link = "https://jobfair-1.onrender.com"


const Row = ({ number, name, ticketId, uniId, email, phoneNumber, studyLevel, major, gpa, nationality, experience, attended, age, portfolio, languages, file, qrCode }) => {
    const expandApplicantDiv = useRef();
    const expandApplicantBtn = useRef();
    const [isVisible, setIsVisible] = useState(false);


    const expandApplicant = () => {
        if (expandApplicantDiv.current) {
            setIsVisible(true); // Use state to handle visibility
        }
    }

    useEffect(() => {
        function getAllDescendants(element, descendantsList) {
            if (!element) return;

            const children = element.children;
            for (let i = 0; i < children.length; i++) {
                descendantsList.push(children[i]);
                getAllDescendants(children[i], descendantsList);
            }
        }






        const handleClickOutside = (e) => {
            const parentElement = document.querySelector('.parent');
            const descendantsList = [];
            getAllDescendants(parentElement, descendantsList);




            if (expandApplicantDiv.current && e.target !== expandApplicantBtn.current && !descendantsList.includes(e.target)) {
                setIsVisible(false); // Hide div when clicking outside
            }
        };

        window.addEventListener("click", handleClickOutside);

        return () => {
            window.removeEventListener("click", handleClickOutside);
        };
    }, []);





    return (
        <>
            <div className="row grid md:w-full w-[55em] py-3 px-2 items-center mb-2">
                <h2 className="md:mx-0 mx-3">{number}</h2>
                <h2 className="md:mx-0 mr-2">{name}</h2>
                <h2 className="md:mx-0 mr-2">{uniId}</h2>
                <div className="">
                    <span>{studyLevel} of</span>
                    <span> {major}</span>
                </div>
                <h2 className="md:mx-0 mr-2">{gpa}</h2>
                <h2 className="md:mx-0 mr-2">{nationality}</h2>
                <h2 className="md:mx-0 mr-2">{age}</h2>
                <div className="relative">
                    <button ref={expandApplicantBtn} onClick={expandApplicant}>...</button>
                    <div ref={expandApplicantDiv} className={`parent bg-white shadow-2xl rounded-xl px-8 py-10 w-80 md:w-[56em] md:max-w-[196em] h-[50em] overflow-y-scroll md:h-fit fixed top-[50%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${isVisible ? 'opacity-100 z-[99999]' : 'opacity-0 -z-[9999]'}`}>
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
                </div>
            </div>
        </>
    )
}

export default Row;
