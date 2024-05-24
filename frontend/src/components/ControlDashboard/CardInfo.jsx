const CardInfo = ({infoHeader, infoText}) => {
    return (
        <div className="mr-6 ">
            <h6>{infoHeader}</h6>
            <h1 className="text-lg font-bold w-fit">{infoText}</h1>
        </div>
    )
}

export default CardInfo;