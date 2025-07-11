const colorCode = {
    confirmed: {active: '#0066CC', off: '#E5F0FF'},
    registerd: {active: '#0E7F41', off: '#E5FFE5'},
    pending: {active: '#EBC600', off: '#FFFACD'},
    canceled: {active: '#CC0000', off: '#FFE5E5'},
} 

import { EmailIcon } from "./index"

const CardInfo = ({infoHeader, infoText}) => {
    return (
        <div className={`${infoHeader == 'Full name' ? 'w-1/2' : infoHeader == "Email" ? 'max-w-1/2  ' : infoHeader == 'CGPA' ? 'w-1/6' : infoHeader == "Major" ? 'w-6/12' : infoHeader == 'Technical Skills' ? 'w-1/2' : infoHeader == 'Not-technical Skills' ? 'w-1/2' : infoHeader == 'LinkedIn' ? 'w-3/4' : ''} grow overflow-hidden`}>
            <h6>{infoHeader}</h6>
            <h1 className={`text-base font-semibold w-fit ${infoText == 'Registered' || infoText == 'Confirmed' ? `mt-2 bg-[${colorCode.registerd.off}] text-[#${colorCode.registerd.active}] px-4 py-2 rounded-xl` : ''}`}>
            {(infoHeader == "LinkedIn" || infoHeader == "Email") && infoText != '-' 
            ?
            <a
            className="underline flex gap-x-2 items-center"
            target={
                infoText?.startsWith('http') || infoText?.startsWith('www') || infoText?.startsWith('linkedin') 
                ? "_blank"
                : "_self"
            }
            href={
                infoText?.includes('@')
                ? `mailto:${infoText}`
                : infoText?.startsWith('http://') || infoText?.startsWith('https://')
                ? infoText
                : infoText
                ? 'https://' + infoText
                : '#'
            }
            >
                {infoText?.includes('@') ? <EmailIcon size={5} /> : ''}
            {
                infoText?.includes('@')
                ? infoText
                : (infoText?.startsWith('http') || infoText?.startsWith('www'))
                ? 'LinkedIn page'
                : infoText || 'N/A'
            }
            </a>

            : infoText && infoText != 'undefined' 
            ? infoHeader == 'CGPA' && infoText == 0 ? "Not mentioned" : infoText
            : "-" }</h1>
        </div>
    )
}

export default CardInfo;