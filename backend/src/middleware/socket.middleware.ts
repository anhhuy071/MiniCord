import { Socket } from "socket.io";
import { verifyToken } from "../utils/jwt.util.js";

export interface AuthSocket extends Socket {
  data: {
    user: {
      userId: string;
    };
    voiceChannelId?: string;
  };
}

export const requireSocketAuth = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    const decoded = verifyToken(token);

    // Guard against malformed tokens that decode successfully but lack userId
    if (!decoded || typeof decoded.userId !== "string" || decoded.userId.trim() === "") {
      return next(new Error("Authentication error: Token payload is invalid"));
    }

    socket.data.user = { userId: decoded.userId };
    next();
  } catch (error) {
    next(new Error("Authentication error: Invalid token"));
  }
};
