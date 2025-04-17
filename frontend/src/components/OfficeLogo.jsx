import OfficeLogoImage from "../assets/images/casto-logo.jpg"


const OfficeLogo = ({height = 14}) => {
    return (
        <div className={`unilogo w-full h-auto md:h-${height} w-auto`}>
            <a href="/">
                <img className="w-full" src={OfficeLogoImage} alt="" />
            </a>
        </div>
    )
}


export default OfficeLogo