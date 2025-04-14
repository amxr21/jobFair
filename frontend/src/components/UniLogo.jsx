import UniLogoImage from "../assets/images/uni-logo.png";


const UniLogo = ({height = 20}) => {
    return (
        <div className={`unilogo h-14 md:h-${height} h-16`}>
            <a href="">
                <img className="h-full" src={UniLogoImage} alt="" />
            </a>
        </div>
    )
}

export default UniLogo