"use client";

import { useEffect, useRef, useState, MouseEvent } from "react";
import GameRules from "./GameRules";

interface HowToPlayProps {
    onClose: () => void;
}

export default function HowToPlay({ onClose }: HowToPlayProps) {
    const popupRef = useRef<HTMLDivElement>(null);
    const [isProvablyFairVisible, setProvablyFairVisible] = useState(false);

    const handleOutsideClick = (event: MouseEvent | Event) => {
        if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
            onClose();
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [handleOutsideClick]);

    const handleProvablyFairToggle = () => {
        setProvablyFairVisible((prevState) => !prevState);
    };

    return (
        <>
            <div id="aviator-howtoplay-tab" className="aviator-popup-container">
                <div ref={popupRef} className="aviator-howtoplay-popup">
                    <div className="aviator-howtoplay-popup-header">
                        <div className="aviator-howtoplay-popup-header-left">
                            HOW TO PLAY?
                        </div>
                        <div
                            onClick={onClose}
                            id="aviator-howtoplay-popup-close"
                            className="aviator-howtoplay-popup-header-right"
                        >
                            <i className="fa fa-times" aria-hidden="true"></i>
                        </div>
                    </div>
                    <div className="aviator-popup-howtoplay-body">
                        <iframe
                            width="100%"
                            height="432"
                            src="https://www.youtube.com/embed/PZejs3XDCSY"
                            title="Spribe Aviator - How to play?"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                        ></iframe>
                        <img
                            src="assets/images/howtoplay.png"
                            alt="How To Play"
                        />
                    </div>
                    <div className="aviator-howtoplay-popup-footer">
                        <div
                            onClick={handleProvablyFairToggle}
                            id="aviator-howtoplay-detailed"
                            className="aviator-popup-howtoplay-detailed"
                        >
                            detailed rules
                        </div>
                    </div>
                </div>
            </div>

            {isProvablyFairVisible && (
                <GameRules onClose={handleProvablyFairToggle} />
            )}
        </>
    );
}
