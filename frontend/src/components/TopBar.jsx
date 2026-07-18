import { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";
import { ManagerIcon, CastoIcon, VisitorIcon } from "./Icons";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";

const TopBar = ({user}) => {
    const { t } = useTranslation();

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
        <div id="TopBar" className="w-full border flex flex-row items-center justify-between px-3 md:px-4 py-1.5 md:py-2 rounded-md transition-all duration-300 dark:bg-gray-900 dark:border-gray-700">
            <div className="user flex flex-row gap-2 items-center">
                <div className="avatar flex items-center justify-center w-8 h-8 rounded-md shrink-0">
                    {
                        user?.email.split('@')[0] == 'casto'
                        ? <CastoIcon />
                        : user
                            ? <ManagerIcon />
                            : <VisitorIcon />
                    }
                </div>
                <div className="name min-w-0">
                    <h2 className="text-sm md:text-base font-bold truncate dark:text-gray-100">{user ? user.email.split('@')[0] == 'casto' ? t("topbar.castoOffice") : user?.companyName : t("topbar.visitor")}</h2>
                    <h6 className="text-[9px] md:text-[10px] font-extralight text-gray-400 dark:text-gray-500">{user ? t("topbar.managerMode") : t("topbar.guestMode")}</h6>
                </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
                <LanguageToggle />
                <ThemeToggle />
                {user && <NotificationBell />}
                <div className="hidden md:block time text-right">
                    <h4 className="time text-xl font-bold dark:text-gray-100">{time}</h4>
                    <p className="date text-[10px] font-extralight text-gray-400 dark:text-gray-500">{`${day}, ${date[0]} ${date[1]} ${date[2]}`}</p>
                </div>
            </div>
        </div>
    )
}

export default TopBar