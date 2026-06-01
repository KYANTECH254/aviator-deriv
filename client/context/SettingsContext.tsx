"use client";
import useUserInteraction from '@/hooks/useUserInteraction';
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

// Define the type for the context state
interface SettingsContextType {
    isMusicEnabled: boolean;
    isSoundEnabled: boolean;
    isAnimationEnabled: boolean;
    toggleMusic: () => void;
    toggleSound: () => void;
    toggleAnimation: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isMusicEnabled, setIsMusicEnabled] = useState<boolean>(false);
    const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(false);
    const [isAnimationEnabled, setIsAnimationEnabled] = useState<boolean>(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { eventTriggered } = useUserInteraction();

    useEffect(() => {
        const storedSound = JSON.parse(localStorage.getItem('isSoundEnabled') || 'false');
        const storedMusic = JSON.parse(localStorage.getItem('isMusicEnabled') || 'false');
        const storedAnimation = JSON.parse(localStorage.getItem('isAnimationEnabled') || 'false');

        setIsSoundEnabled(storedSound);
        setIsMusicEnabled(storedMusic);
        setIsAnimationEnabled(storedAnimation);

        if (eventTriggered) {
            if (storedMusic) {
                if (!audioRef.current) {
                    audioRef.current = new Audio('/assets/audio/aviatormusic.mp3');
                    audioRef.current.loop = true;
                }
                audioRef.current.play().catch((err) => console.error("Music play error:", err));
            }
        }
    }, [eventTriggered]);

    const toggleSound = () => {
        const newValue = !isSoundEnabled;
        setIsSoundEnabled(newValue);
        localStorage.setItem('isSoundEnabled', JSON.stringify(newValue));
    };

    const toggleMusic = () => {
        const newValue = !isMusicEnabled;
        setIsMusicEnabled(newValue);
        localStorage.setItem('isMusicEnabled', JSON.stringify(newValue));

        if (!audioRef.current) {
            audioRef.current = new Audio('/assets/audio/aviatormusic.mp3');
            audioRef.current.loop = true;
        }

        if (newValue) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((err) => console.error("Music play error:", err));
        } else {
            audioRef.current.pause();
        }
    };

    const toggleAnimation = () => {
        const newValue = !isAnimationEnabled;
        setIsAnimationEnabled(newValue);
        localStorage.setItem('isAnimationEnabled', JSON.stringify(newValue));
    };

    return (
        <SettingsContext.Provider
            value={{
                isMusicEnabled,
                isSoundEnabled,
                isAnimationEnabled,
                toggleMusic,
                toggleSound,
                toggleAnimation,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};
