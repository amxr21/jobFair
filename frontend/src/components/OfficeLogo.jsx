import OfficeLogoImage from "../assets/images/casto-logo.jpg"


const OfficeLogo = ({height = 14}) => {
    return (
        <div className={`unilogo h-12 md:h-${height} w-auto`}>
            <a href="/">
                <img className="h-full" src={OfficeLogoImage} alt="" />
            </a>
        </div>
    )
}


export default OfficeLogo