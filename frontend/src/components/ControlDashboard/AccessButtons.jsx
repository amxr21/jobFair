import { useState, useEffect } from "react";
import QRCode from "qrcode.react";
import { Link } from "react-router-dom"
import "../../style.css"

import { useLogout } from "../../Hooks/useLogout"
import { useAuthContext } from "../../Hooks/useAuthContext";

const AccessButtons = () => {
    const [ visible, setVisible ] = useState(false);

    const { logout } = useLogout();
    const handleLogout = (e) => {
        logout();
    }
    const { user } = useAuthContext();

    const showQRCode = (e) => {
        if(!visible){
            setVisible(true);
            e.target.textContent = "Hide QR code";
        }
        else{
            setVisible(false);
            e.target.textContent = "Show QR code";
        }
        
        setTimeout(()=>{
            setVisible(false);
            e.target.textContent = "Show QR code";
            
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
        
        e.target.textContent = "Downloaded!!"
        setTimeout(()=>{
            e.target.textContent = "Download QR Code"
        },3000)

    }


    return (
        <div className="access-buttons flex md:flex-row flex-col gap-4 md:w-fit w-full">
                {user && (<div className="flex items-center justify-between"> <span className="mx-2">{user.email}</span>
                    <button onClick={handleLogout} className="px-3 py-1 border border-2 rounded-md" type="submit">Log out</button>
                </div>)}
                <div className="relative flex gap-x-2">
                    {
                        user?.user_id &&
                        <>
                            <button onClick={downloadQRCode} className="h-full md:w-fit w-full md:ml-2 px-3 py-1 border border-2 rounded-md">Download Qr code</button>
                            <button onClick={showQRCode} className="h-full md:w-fit w-full md:ml-2 px-3 py-1 border border-2 rounded-md">Show Qr code</button>
                        </>
                    }


                    {
                        user?.user_id || visible
                        ?
                        visible
                        ?
                        <div className="qrcode flex items-center top-12 p-2 bg-white shadow-2xl rounded-md absolute h-48 -right-5 py-6 px-8 z-50">
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
                <>
                    <Link to="/login">
                        <button className="px-3 py-1 border md:w-fit w-full bg-white opacity-80 border-2 rounded-md">Log in</button>
                    </Link>
                    <Link to="/signup">
                        <button className="px-3 py-1 border md:w-fit w-full bg-white opacity-80 border-2 rounded-md">Sign up</button>
                    </Link>
                </>

                )}

        </div>
    )
}

export default AccessButtons;