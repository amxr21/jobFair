import { useEffect, useState } from "react";

import { ManagerIcon, CastoIcon, VisitorIcon } from "./Icons";

const TopBar = ({user}) => {
    
    const [time, setTime] = useState(getLiveTime)
    const [day, setDay] = useState('')
    const [date, setDate] = useState('')
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    
    
   useEffect(() => {
    const getDay = () => {
        const now = new Date();

        // Get the full date string in UAE timezone
        const options = { timeZone: "Asia/Dubai", weekday: "long", month: "short", day: "numeric", year: "numeric" };
        const dateInUAE = new Date().toLocaleString("en-US", options);

        // Split the string to get day and date info
        const [weekday, month, dayNum, year] = dateInUAE.replace(',', '').split(' ');
        
        setDay(weekday); // e.g., 'Sunday'
        setDate([month, dayNum, year]); // e.g., ['Apr', '21', '2024']
    };

    getDay();

}, []);


    
    
    
    function getLiveTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
    


        return `${hours}:${minutes}:${seconds}`;
    }
    
    useEffect(() => {
        const updateTime = setInterval(() => {
            setTime(getLiveTime())
    
        }, 1000);


        return () => {
            clearInterval(updateTime)
        }
    },[])
    

    return (
        <div id="TopBar" className="md:w-full w-full md:min-h-24 border border-[0.5px] flex flex-col md:flex-row items-center justify-between p-5 rounded-2xl">
            <div className="user flex flex-col md:flex-row gap-4">
                <div className="avatar flex items-center justify-center w-12 h-12 border rounded-xl">
                    {
                        user?.email.split('@')[0] == 'casto'
                        ? <CastoIcon />
                        : user
                            ? <ManagerIcon />
                            : <VisitorIcon />
                    }
                </div>
                <div className="name">
                    <h2 className="text-xl md:text-2xl font-bold">{user ? user.email.split('@')[0] == 'casto' ? "CASTO Office" : user?.companyName : "Visitor"}</h2>
                    <h6 className="text-sm font-extralight text-gray-400">{user ? "Manager mode" : "Guest mode"}</h6>
                </div>
            </div>
            <div className="hidden md:block time text-right">
                <h4 className="time text-4xl font-bold">{time}</h4>
                <p className="date text-sm font-extralight text-gray-400">{`${day},. ${date[0]} ${date[1]} ${date[2]}`}</p>
            </div>
        </div>
    )
}

export default TopBar