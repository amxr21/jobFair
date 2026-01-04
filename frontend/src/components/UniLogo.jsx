import UniLogoImage from "../assets/images/uni-logo.png";

const heightClasses = {
    12: 'md:h-12',
    14: 'md:h-14',
    16: 'md:h-16',
    20: 'md:h-20',
    24: 'md:h-24',
};

const UniLogo = ({ height = 20 }) => {
    return (
        <div className={`unilogo h-14 ${heightClasses[height] || 'md:h-20'}`}>
            <a href="/">
                <img className="h-full" src={UniLogoImage} alt="University Logo" />
            </a>
        </div>
    )
}

export default UniLogo