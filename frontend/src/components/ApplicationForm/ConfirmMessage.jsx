import { useRef } from "react"
import QRCode from 'qrcode.react';

const ConfirmMessageDiv = ({confirmMessageRef, qrCodeSrc}) => {
    return (
        <div ref={confirmMessageRef} className="confirmMessageRef opacity-1 flex flex-col md:flex-row gap-x-16 gap-y-4 md:gap-y-0 items-center justify-center bg-white rounded-2xl shadow-2xl px-10 md:px-16 py-12 my-4 h-fit overflow-hidden">
            <div className="qr-code w-4/12 flex flex-col items-center">
                <div className="qr-code w-48 flex flex-col items-center mb-6">
                    {/* <img src={qrCodeSrc} className="w-full" alt="" /> */}
                    {qrCodeSrc && <QRCode value={`${qrCodeSrc}`} />}
                    {!qrCodeSrc && <h2>Loading the QR code...</h2>}
                </div>
                <div className="ticket-id flex font-semibold">
                    <h6>Ticket no.</h6>
                    <span>123456</span>
                </div>
            </div>
            <div className="confirmation-message w-8/12">
                <h2 className="text-4xl font-bold mb-1">Confirmed !</h2>
                <p>Congtratulations in applying for your first company!!. Check your email to have your ticket.</p>
                <br /><br />
                <h5 className="text-2xl font-semibold" >Best of Luck !!</h5>
            </div>
        </div>
    )
}
export default ConfirmMessageDiv

//my idea breif
//each QR code will represent a uniqure id for each applicant file
//this id is the key for each file
//once the QR code is scanned this will log in the employer into a website with a simple log in 
//the website will display all the applicant that has been scanned by the employee him/her-self
//the scan process must be initiated from the website itself so the file scanned is getting saved to the relevant website