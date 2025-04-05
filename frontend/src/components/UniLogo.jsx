import UniLogoImage from "../assets/images/uni-logo.png";


const UniLogo = () => {
    return (
        <div className="unilogo h-16 md:h-20">
            <a href="">
                <img className="h-full" src={UniLogoImage} alt="" />
            </a>
        </div>
    )
}

export default UniLogo