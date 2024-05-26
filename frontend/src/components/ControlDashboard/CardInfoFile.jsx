import axios from "axios"

const link = "https://jobfair-1.onrender.com"

const CardInfoFile = ({file}) => {
    const downloadCV = () => {
        axios({
            method: "GET",
            url: `${link}/cv/${file?.id}`,
            responseType: "blob"
        })
        .then(response => {
            const url = window.URL.createObjectURL(new Blob([response.data], {type: "application/pdf"}));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file?.originalname);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })
        .catch(error => {
            console.error("Error downloading file:", error);
        });
    }




    return (
        <div className="w-1/3 px-1">
            <h6 className="text-sm">{"CV:"}</h6>
            <h1 onClick={() => downloadCV(file)} className="flex items-center h-auto max-h-fit text-md font-bold w-full cursor-pointer">
                {file.originalname}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fillRule="currentColor" className="ml-2 bi bi-download" viewBox="0 0 16 16">
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
                </svg>
            </h1>
        </div>

    )
}

export default CardInfoFile;