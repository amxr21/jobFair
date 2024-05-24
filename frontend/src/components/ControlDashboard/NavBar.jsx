import OfficeLogo from "../../assets/images/casto-logo.jpg"
import UniLogo from "../../assets/images/uni-logo.png";
import { BrowserRouter, Routes, Route } from "react-router-dom"

const NavBar = () => {
    return (
        <nav className="flex items-center justify-between h-20 overflow-hidden mb-12">
            <div className="unilogo h-16">
                <a href="/">
                    <img className="h-full" src={OfficeLogo} alt="" />
                </a>
            </div>
            <div className="unilogo h-20">
                <a href="">
                    <img className="h-full" src={UniLogo} alt="" />
                </a>
            </div>
        </nav>
    )
}


export default NavBar;