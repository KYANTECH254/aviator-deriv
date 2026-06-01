import { useState, useEffect, useRef } from 'react';
import useUserInteraction from './useUserInteraction';

export default function useSettings() {
    // Initialize states with proper type annotations and localStorage values
    const [isMusicEnabled, setIsMusicEnabled] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('isMusicEnabled');
            return stored !== null ? JSON.parse(stored) : true;
        }
        return true;
    });

    const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('isSoundEnabled');
            return stored !== null ? JSON.parse(stored) : true;
        }
        return true;
    });

    const [isAnimationEnabled, setIsAnimationEnabled] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('isAnimationEnabled');
            return stored !== null ? JSON.parse(stored) : true;
        }
        return true;
    });

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { eventTriggered } = useUserInteraction();

    // Set up localStorage defaults on initial mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (localStorage.getItem('isMusicEnabled') === null) {
                localStorage.setItem('isMusicEnabled', JSON.stringify(true));
            }
            if (localStorage.getItem('isSoundEnabled') === null) {
                localStorage.setItem('isSoundEnabled', JSON.stringify(true));
            }
            if (localStorage.getItem('isAnimationEnabled') === null) {
                localStorage.setItem('isAnimationEnabled', JSON.stringify(true));
            }
        }
    }, []);

    // Handle audio playback logic
    useEffect(() => {
        if (eventTriggered) {
            if (!audioRef.current) {
                audioRef.current = new Audio('/assets/audio/aviatormusic.mp3');
                audioRef.current.loop = true;
            }

            if (isMusicEnabled) {
                audioRef.current.currentTime = 0; // Reset playback position
                audioRef.current.play().catch((error) => 
                    console.error('Audio playback failed:', error)
                );
            } else {
                audioRef.current.pause();
            }
        }
    }, [isMusicEnabled, eventTriggered]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const toggleMusic = () => {
        setIsMusicEnabled(prev => {
            const newValue = !prev;
            localStorage.setItem('isMusicEnabled', JSON.stringify(newValue));
 
            if (!audioRef.current) {
                audioRef.current = new Audio('/assets/audio/aviatormusic.mp3');
                audioRef.current.loop = true;
            }
    
            if (newValue && eventTriggered) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch((error) =>
                    console.error('Audio playback failed:', error)
                );
            } else {
                audioRef.current.pause();
            }
    
            return newValue;
        });
    };
    

    const toggleSound = () => {
        setIsSoundEnabled(prev => {
            const newValue = !prev;
            localStorage.setItem('isSoundEnabled', JSON.stringify(newValue));
            return newValue;
        });
    };

    const toggleAnimation = () => {
        setIsAnimationEnabled(prev => {
            const newValue = !prev;
            localStorage.setItem('isAnimationEnabled', JSON.stringify(newValue));
            return newValue;
        });
    };

    return {
        isMusicEnabled,
        isSoundEnabled,
        isAnimationEnabled,
        toggleMusic,
        toggleSound,
        toggleAnimation,
        setIsMusicEnabled,
        setIsAnimationEnabled,
    };
}