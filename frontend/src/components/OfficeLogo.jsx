import OfficeLogoImage from "../assets/images/casto-logo.jpg"


const OfficeLogo = ({width}) => {
    return (
        <div className={`unilogo h-auto ${width ? '' : 'w-full'}`} style={width ? {width: `${width}rem`} : {}}>
            <a href="/">
                <img className="w-full" src={OfficeLogoImage} alt="" />
            </a>
        </div>
    )
}


export default OfficeLogo