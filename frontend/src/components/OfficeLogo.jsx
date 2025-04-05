import OfficeLogoImage from "../assets/images/casto-logo.jpg"


const OfficeLogo = () => {
    return (
        <div className="unilogo h-12 md:h-14 w-auto">
            <a href="/">
                <img className="h-full" src={OfficeLogoImage} alt="" />
            </a>
        </div>
    )
}


export default OfficeLogo