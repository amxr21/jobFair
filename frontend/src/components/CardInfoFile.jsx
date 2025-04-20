import axios from "axios"
import { useState } from "react";

import LoadingImage from './../assets/images/loading.gif'


// const link = "https://jobfair-7zaa.onrender.com"
// const link = "http://localhost:2000"
const link = "https://jobfair-production.up.railway.app"

const CardInfoFile = ({file}) => {
  const [ isFileLoading, setIsFileLoading ] = useState(false)



    const downloadCV = () => {
        console.log(`${link}/cv/${file?.id}`);
        setIsFileLoading(true)
        
        axios({
          method: "GET",
          url: `${link}/cv/${file?.id}`,
          responseType: "blob", // ✅ very important!
        })
        .then((response) => {
          const blob = new Blob([response.data], { type: response.data.type || 'application/octet-stream' });
          const url = window.URL.createObjectURL(blob);
      
          const linkElement = document.createElement("a");
          linkElement.href = url;
          linkElement.setAttribute("download", file?.originalname || "downloaded_file"); // ✅ fallback filename
          document.body.appendChild(linkElement);
          linkElement.click();
          linkElement.remove();
          window.URL.revokeObjectURL(url); // ✅ cleanup
        })
        .catch((error) => {
          console.error("Download failed:", error);
        })
        .finally(() => {
          setIsFileLoading(false)
        })
        
        ;
      };
      




    return (
      <>
          {
            isFileLoading &&
            <div className="fixed inset-0 z-[9999] flex items-center justify-center ">
              <div className="w-20 h-20 p-1 flex items-center justify-center rounded-xl overflow-hidden text-white text-lg font-semibold border shadow-xl">
                <img src={LoadingImage} alt="" className="scale-[130%]" />
              </div>
            </div>

          }



        <div className="w-4/12">

            <h6 className="text-lg">{"CV:"}</h6>
            
            <div className="flex h-7 overflow-hidden justify-between">
              <h2 className={`${file ? 'text-black break-words whitespace-normal overflow-hidden text-wrap' : 'text-gray-300 cursor-not-allowed'} font-semibold`}>{file ? file.originalname : "No Uploaded file" }</h2>
              <button onClick={() => downloadCV(file)} className={`flex h-auto w-fit max-h-fit text-lg font-bold w-full ${file ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${file ? 'text-black' : 'text-gray-300'} size-6`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>

              </button>

            </div>
        </div>
      </>

    )
}

export default CardInfoFile;