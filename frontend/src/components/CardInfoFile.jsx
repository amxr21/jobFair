import axios from "axios"

const link = "https://jobfairform-backend.onrender.com"
// const link = "http://localhost:2000"

const CardInfoFile = ({file}) => {
    const downloadCV = () => {
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
        });
      };
      




    return (
        <div className="w-1/3 px-1">
            <h6 className="text-sm">{"CV:"}</h6>
            <button onClick={() => downloadCV(file)} className="bg-red-500 flex items-center h-auto max-h-fit text-md font-bold w-full cursor-pointer">
                {file?.originalname}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fillRule="currentColor" className="ml-2 bi bi-download" viewBox="0 0 16 16">
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
                </svg>
            </button>
        </div>

    )
}

export default CardInfoFile;