import { useState, useEffect } from "react";
import QRCode from "qrcode.react";
import { Link } from "react-router-dom"
import "../style.css"

import { useLogout } from "../Hooks/useLogout"
import { useAuthContext } from "../Hooks/useAuthContext";

const AccessButtons = () => {
    const [ visible, setVisible ] = useState(false);

    const { logout } = useLogout();
    const handleLogout = () => { 
        logout();
    }
    const { user } = useAuthContext();

    const showQRCode = (e) => {
        if(!visible){
            setVisible(true);
            // e.target.textContent = "Hide QR code";
        }
        else{
            setVisible(false);
            // e.target.textContent = "Show QR code";
        }
        
        setTimeout(()=>{
            setVisible(false);
            // e.target.textContent = "Show QR code";
            
        }, 5000)


    }


    const downloadQRCode = (e) => {
        const canvas = document.querySelector(".qrcode canvas");
        const pngUrl = canvas
            .toDataURL("image/png")
            .replace("image/png", "image/octet-stream");

        let downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = "qrCode.png";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        console.log(downloadLink);
        document.body.removeChild(downloadLink);
        
        console.log('====================================');
        console.log(e.target);
        console.log('====================================');

        e.target.textContent = "Downloaded!!"
        setTimeout(()=>{
            e.target.textContent = "Download QR Code"
        },3000)

    }


    

    const LogOutIcon = () => {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />
            </svg>

        )
    }



    const QrCodeIcon = () => {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
            </svg>

        )
    }








    return (
        <div className="access-buttons flex flex-col gap-4 w-full">
                {/* {user && (<div className="flex flex-col items-center justify-between"> <span className="mx-2">{user.email}</span>
                    <button onClick={handleLogout} className="px-3 py-1 border border-2 rounded-md" type="submit">Log out</button>
                </div>)} */}
                <div className="relative flex flex-col gap-y-2">
                    <div className="flex flex-row gap-x-1">
                        {user && 
                        (
                            // <div className="flex grow items-center justify-center p-3 gap-x-5 border border-2 rounded-xl" onClick={handleLogout}>
                            <Link to={'/Signup'} className="flex flex-col md:flex-row grow items-center justify-center p-2 xl:p-3 gap-x-5 border border-2 rounded-xl" onClick={handleLogout}>
                                <LogOutIcon />
                                <div onClick={handleLogout} className="" type="submit">Log out</div>
                            </Link>
                            // </div>
                        )
                        }
                        
                        {
                            user?.user_id &&
                            <>
                                {/* <button onClick={showQRCode} onDoubleClick={downloadQRCode} className="text-sm h-full p-3 border border-2 rounded-xl">
                                    <QrCodeIcon /> 
                                </button> */}
                                {/* <button onClick={downloadQRCode} className="text-sm h-full p-3 border border-2 rounded-xl">
                                    <QrCodeIcon /> 
                                </button> */}
                            </>
                        }


                    </div>


                    {
                        user?.user_id || visible
                        ?
                        visible
                        ?
                        <div className="qrcode flex items-center p-2 bg-white shadow-2xl rounded-md absolute h-40 -bottom-14 left-0 py-4 px-6 z-[9999]">
                            <QRCode value={user?.user_id}/>
                        </div>
                        :
                        <div className="hidden absolute qrcode items-center top-12 p-2 bg-white shadow-2xl rounded-md absolute h-48 -right-5 py-6 px-8 z-50">
                            <QRCode value={user?.user_id}/>
                        </div>
                        : ""
                    }

                </div>
                {!user && (
                <div className="flex justify-between gap-x-4">
                    <Link to="/login" className="grow">
                        <button className="text-center px-2 py-1 text-center w-full border-[0.5px] bg-white rounded-md">Log in</button>
                    </Link>
                    <Link to="/signup" className="grow">
                        <button className="text-center px-2 py-1 text-center w-full border-[0.5px] bg-white rounded-md">Sign up</button>
                    </Link>
                </div>

                )}

        </div>
    )
}

export default AccessButtons;