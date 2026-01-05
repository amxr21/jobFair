const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/userModel");

let io;

// Store connected users: { odId: { sockets: Set, companyName: string, isCASTO: boolean } }
const connectedUsers = new Map();

const initializeSocket = (server, allowedOrigins) => {
    io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Authentication middleware for socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                // Allow unauthenticated connections (visitors)
                socket.user = null;
                return next();
            }

            // Verify JWT token
            const decoded = jwt.verify(token, process.env.TOKEN_SIGN);
            const user = await UserModel.findById(decoded._id).select('-password');

            if (!user) {
                return next(new Error("User not found"));
            }

            socket.user = user;
            next();
        } catch (error) {
            // Allow connection but mark as unauthenticated
            socket.user = null;
            next();
        }
    });

    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // If authenticated, track the user
        if (socket.user) {
            const odId = socket.user._id.toString();
            const isCASTO = socket.user.email === "casto@sharjah.ac.ae";

            if (!connectedUsers.has(odId)) {
                connectedUsers.set(odId, {
                    sockets: new Set(),
                    companyName: socket.user.companyName,
                    isCASTO
                });
            }
            connectedUsers.get(odId).sockets.add(socket.id);

            // Join user-specific room
            socket.join(`user:${odId}`);

            // Join company room for targeted broadcasts
            socket.join(`company:${socket.user.companyName}`);

            // CASTO admin joins admin room for all updates
            if (isCASTO) {
                socket.join("admin");
            }

            console.log(`User authenticated: ${socket.user.companyName} (CASTO: ${isCASTO})`);
        }

        // Join public room for general broadcasts
        socket.join("public");

        // Handle manual room joining (for specific dashboards)
        socket.on("join:dashboard", (dashboard) => {
            socket.join(`dashboard:${dashboard}`);
            console.log(`Socket ${socket.id} joined dashboard: ${dashboard}`);
        });

        // Handle disconnect
        socket.on("disconnect", () => {
            if (socket.user) {
                const odId = socket.user._id.toString();
                const userData = connectedUsers.get(odId);

                if (userData) {
                    userData.sockets.delete(socket.id);
                    if (userData.sockets.size === 0) {
                        connectedUsers.delete(odId);
                    }
                }
            }
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

// Get the Socket.io instance
const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized. Call initializeSocket first.");
    }
    return io;
};

// Emit events to specific targets
const emitEvent = {
    // Broadcast to all connected clients
    toAll: (event, data) => {
        if (io) io.emit(event, data);
    },

    // Broadcast to admin room (CASTO)
    toAdmin: (event, data) => {
        if (io) io.to("admin").emit(event, data);
    },

    // Broadcast to a specific company
    toCompany: (companyName, event, data) => {
        if (io) io.to(`company:${companyName}`).emit(event, data);
    },

    // Broadcast to a specific user
    toUser: (odId, event, data) => {
        if (io) io.to(`user:${odId}`).emit(event, data);
    },

    // Broadcast to a specific dashboard
    toDashboard: (dashboard, event, data) => {
        if (io) io.to(`dashboard:${dashboard}`).emit(event, data);
    },

    // Broadcast to public room
    toPublic: (event, data) => {
        if (io) io.to("public").emit(event, data);
    }
};

module.exports = {
    initializeSocket,
    getIO,
    emitEvent,
    connectedUsers
};
