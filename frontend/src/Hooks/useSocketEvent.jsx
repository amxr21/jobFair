import { useEffect } from "react";
import { useSocket } from "../Context/SocketContext";

/**
 * Custom hook to subscribe to socket events
 * @param {string} event - The event name to listen for
 * @param {function} callback - The callback function to execute when event is received
 */
export const useSocketEvent = (event, callback) => {
    const { socket, isConnected } = useSocket();

    useEffect(() => {
        if (!socket || !isConnected) return;

        socket.on(event, callback);

        return () => {
            socket.off(event, callback);
        };
    }, [socket, isConnected, event, callback]);

    return { isConnected };
};

/**
 * Custom hook to emit socket events
 */
export const useSocketEmit = () => {
    const { socket, isConnected } = useSocket();

    const emit = (event, data) => {
        if (socket && isConnected) {
            socket.emit(event, data);
        }
    };

    return { emit, isConnected };
};

export default useSocketEvent;
