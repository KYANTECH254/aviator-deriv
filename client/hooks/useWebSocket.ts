"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type SocketMessage = {
  eventName: string;
  data: any;
};

type UseWebSocketProps = {
  authToken?: string;
  onMessage?: (message: SocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function useWebSocket({
  authToken,
  onMessage,
  onConnect,
  onDisconnect,
}: UseWebSocketProps = {}) {
  const [wssocket, setWssocket] = useState<Socket | null>(null);

  const onMessageRef = useRef(onMessage);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
  }, [onMessage, onConnect, onDisconnect]);

  useEffect(() => {
    if (!API_URL) {
      console.error("NEXT_PUBLIC_API_URL is missing");
      return;
    }

    if (!authToken) {
      console.warn("Skipping Socket.IO connection because auth token is missing.");
      return;
    }

    const socket = io(API_URL, {
      auth: {
        token: authToken,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    setWssocket(socket);

    socket.on("connect", () => {
      onConnectRef.current?.();
    });

    socket.on("disconnect", () => {
      onDisconnectRef.current?.();
    });

    socket.onAny((eventName, data) => {
      onMessageRef.current?.({
        eventName,
        data,
      });
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      setWssocket(null);
    };
  }, [authToken]);

  return { wssocket };
}