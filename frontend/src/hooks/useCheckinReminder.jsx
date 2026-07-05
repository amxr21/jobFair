import { useEffect, useRef } from "react";
import { useNotifications } from "../context/NotificationsContext";
import { useEventOps } from "../context/EventOpsContext";

// Reminds a logged-in company to check in at their booth — once shortly after
// login, then hourly — until they've actually checked in. CASTO accounts and
// logged-out visitors are skipped. The reminder collapses onto a single unread
// entry (dedupeKey) so it never stacks into a wall of duplicates.
//
// "every 1 hr" per the product spec. The first nudge fires ~20s after mount so
// it doesn't race the initial event-ops hydration (attendance status arrives
// from the backend a moment after load).
const HOUR = 60 * 60 * 1000;
const FIRST_DELAY = 20 * 1000;

export const useCheckinReminder = (user) => {
    const { notify } = useNotifications();
    const { isCompanyCheckedIn } = useEventOps();
    const timerRef = useRef(null);

    const isCASTO = user?.companyName === "CASTO Office" || user?.email === "casto@sharjah.ac.ae";
    const companyName = user?.companyName;

    useEffect(() => {
        // Only nudge real companies that are logged in
        if (!user || isCASTO || !companyName) return;

        const fire = () => {
            if (isCompanyCheckedIn(companyName)) return; // already in — nothing to nudge
            notify("Have you checked in at your booth?", {
                type: "reminder",
                detail: "Scan the QR code at your booth (or use the button on your Status page) to confirm your attendance.",
                dedupeKey: `checkin-reminder:${companyName}`,
                link: "/company-status",
            });
        };

        const first = setTimeout(fire, FIRST_DELAY);
        timerRef.current = setInterval(fire, HOUR);
        return () => { clearTimeout(first); clearInterval(timerRef.current); };
        // isCompanyCheckedIn is read at fire time, not a dependency — re-subscribing
        // on every attendance-data change would reset the hourly cadence.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isCASTO, companyName, notify]);
};
