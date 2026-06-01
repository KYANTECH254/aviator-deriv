"use client"

import { useState, useEffect } from 'react';

const useUserInteraction = () => {
    const [eventTriggered, setEventTriggered] = useState<any>(false);

    const handleUserInteraction = () => {
        setEventTriggered(true);
    };

    useEffect(() => {
        if (!eventTriggered) {
            const handleClick = () => {
                handleUserInteraction();
            };
            window.addEventListener("click", handleClick, { once: true });
            return () => {
                window.removeEventListener("click", handleClick);
            };
        }
    }, [eventTriggered]); 

    return {eventTriggered};
};

export default useUserInteraction;
