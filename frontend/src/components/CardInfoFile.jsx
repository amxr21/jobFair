import axios from "axios"
import { useState } from "react";

import LoadingImage from './../assets/images/loading.gif'
import { API_URL as link } from "../config/api";

const CardInfoFile = ({file}) => {
  const [ isFileLoading, setIsFileLoading ] = useState(false)



    const downloadCV = () => {
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
          // Download failed
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



        <div className="min-w-0">
            <h6 className="text-xs text-gray-500 mb-1">CV</h6>
            <div className="flex items-center gap-2">
              <p className={`text-sm font-semibold break-words ${file ? 'text-black' : 'text-gray-400'}`}>
                {file ? file.originalname : "No file uploaded"}
              </p>
              {file && (
                <button onClick={() => downloadCV(file)} className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </button>
              )}
            </div>
        </div>
      </>

    )
}

export default CardInfoFile;