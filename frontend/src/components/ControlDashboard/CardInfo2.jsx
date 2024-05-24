const CardInfo2 = ({infoHeader, infoText}) => {
    if(infoText == "") infoText = "Nothing yet..."
    return (
        <div className="w-1/3 px-1 overflow-hidden">
            <h6 className="text-sm">{infoHeader}</h6>
            {
            infoText.slice(0,4) == "http"
            ? <a href={infoText} target="_blank" className="overflow-ellipsis overflow-hidden h-auto max-h-fit text-md font-bold cursor-pointer">{infoText}</a>
            : <h1 className="overflow-ellipsis h-auto max-h-fit text-md font-bold w-full">{infoText}</h1>
            }
        </div>
    )
}

export default CardInfo2;