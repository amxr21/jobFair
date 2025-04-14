const colorCode = {
    confirmed: {active: '#0066CC', off: '#E5F0FF'},
    registerd: {active: '#0E7F41', off: '#E5FFE5'},
    pending: {active: '#EBC600', off: '#FFFACD'},
    canceled: {active: '#CC0000', off: '#FFE5E5'},
} 

const CardInfo = ({infoHeader, infoText}) => {
    return (
        <div className={`${infoHeader == 'Full name' ? 'w-1/2' : infoHeader == "Email" ? 'max-w-1/2  ' : infoHeader == 'CGPA' ? 'w-1/6' : infoHeader == "Major" ? 'w-6/12' : ''} grow overflow-hidden`}>
            <h6>{infoHeader}</h6>
            <h1 className={`text-xl font-semibold w-fit ${infoText == 'Registered' || infoText == 'Confirmed' ? `mt-2 bg-[${colorCode.registerd.off}] text-[#${colorCode.registerd.active}] px-4 py-2 rounded-xl` : ''}`}>{infoText && infoText != 'undefined' ? infoText : "-" }</h1>
        </div>
    )
}

export default CardInfo;