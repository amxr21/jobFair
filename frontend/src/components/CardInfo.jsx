const colorCode = {
    confirmed: {active: '#0066CC', off: '#E5F0FF'},
    registerd: {active: '#0E7F41', off: '#E5FFE5'},
    pending: {active: '#EBC600', off: '#FFFACD'},
    canceled: {active: '#CC0000', off: '#FFE5E5'},
} 

import { EmailIcon } from "./index"

// Format multiline text - intelligently handles different text patterns
const formatMultilineText = (text) => {
    if (!text || text === 'undefined') return null;

    const str = String(text).trim();

    // Check if it looks like a list (has bullet points, numbers, or dashes at start of lines)
    const listPatterns = /^[\s]*[-•*]\s|^[\s]*\d+[.)]\s/m;
    if (listPatterns.test(str) || str.includes('\n-') || str.includes('\n•')) {
        const items = str.split(/\n/).map(item => item.replace(/^[-•*\d.)]+\s*/, '').trim()).filter(Boolean);
        return (
            <ul className="list-disc list-inside space-y-1">
                {items.map((item, index) => (
                    <li key={index} className="text-sm">{item}</li>
                ))}
            </ul>
        );
    }

    // Check if it has line breaks - render as paragraphs
    if (str.includes('\n')) {
        const paragraphs = str.split('\n').filter(p => p.trim());
        return (
            <div className="space-y-2">
                {paragraphs.map((para, index) => (
                    <p key={index} className="text-sm">{para.trim()}</p>
                ))}
            </div>
        );
    }

    // Default: render as single text
    return <p className="text-sm">{str}</p>;
};

const CardInfo = ({infoHeader, infoText, multiline = false}) => {
    return (
        <div className="min-w-0">
            {infoHeader && <h6 className="text-xs text-gray-500 mb-1">{infoHeader}</h6>}
            {multiline ? (
                <div className="font-medium">
                    {infoText && infoText !== 'undefined' ? formatMultilineText(infoText) : <p className="text-sm text-gray-400">-</p>}
                </div>
            ) : (
                <p className={`text-sm font-semibold break-words ${infoText == 'Confirmed' ? 'mt-1 bg-[#E5F0FF] text-[#0066CC] px-3 py-1.5 rounded-lg w-fit' : infoText == 'Registered' ? 'mt-1 bg-[#E5FFE5] text-[#0E7F41] px-3 py-1.5 rounded-lg w-fit' : ''}`}>
                {(infoHeader == "LinkedIn" || infoHeader == "Email") && infoText != '-'
                ?
                <a
                className="underline flex gap-x-2 items-center text-blue-600 hover:text-blue-800"
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
                : "-" }</p>
            )}
        </div>
    )
}

export default CardInfo;