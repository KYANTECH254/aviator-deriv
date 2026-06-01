"use client";
import { useState, useEffect } from 'react';

const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(true);
    const [connectionType, setConnectionType] = useState('');
    const [isSlowConnection, setIsSlowConnection] = useState(false);

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const connection = (navigator as any).connection || (navigator as any).mozConnection;
        if (connection) {
            setConnectionType(connection.effectiveType);
            setIsSlowConnection(['2g', '3g'].includes(connection.effectiveType));

            const updateConnectionStatus = () => {
                setConnectionType(connection.effectiveType);
                setIsSlowConnection(['2g', '3g'].includes(connection.effectiveType));
            };
            connection.addEventListener('change', updateConnectionStatus);

            return () => connection.removeEventListener('change', updateConnectionStatus);
        }

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return { isOnline, connectionType, isSlowConnection };
};

export default useNetworkStatus;
