"use client";

import { useEffect, useRef, MouseEvent } from "react";

interface GameLimitsProps {
    onClose: () => void; activeAccount: any;
}

export default function GameLimits({ onClose }: GameLimitsProps) {
    const popupRef = useRef<HTMLDivElement>(null);

    const handleOutsideClick = (event: MouseEvent | any) => {
        if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
            onClose();
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    });

    return (
        <div id="aviator-gamelimits-tab" className="aviator-popup-container">
            <div ref={popupRef} className="aviator-gamelimits-popup">
                <div className="aviator-popup-header">
                    <div className="aviator-popup-header-left">GAME LIMITS</div>
                    <div
                        onClick={onClose}
                        id="aviator-gamelimits-popup-close"
                        className="aviator-popup-header-right"
                    >
                        <i className="fa fa-times" aria-hidden="true"></i>
                    </div>
                </div>
                <div className="aviator-popup-gamelimits-body">
                    <div className="aviator-gamelimits-bodycontainer">
                        <div className="aviator-gamelimits-bodycontainer-top">
                            <div className="aviator-gamelimits-bodycontainer-right">
                                Minimum bet USD:
                            </div>
                            <div className="aviator-gamelimits-bodycontainer-left">1.00</div>
                        </div>
                        <div className="aviator-gamelimits-bodycontainer-middle">
                            <div className="aviator-gamelimits-bodycontainer-right">
                                Maximum bet USD:
                            </div>
                            <div className="aviator-gamelimits-bodycontainer-left">
                                1000.00
                            </div>
                        </div>
                        <div className="aviator-gamelimits-bodycontainer-middle">
                            <div className="aviator-gamelimits-bodycontainer-right">
                                Maximum Win USD:
                            </div>
                            <div className="aviator-gamelimits-bodycontainer-left">
                                6000.00
                            </div>
                        </div>
                        <div className="aviator-gamelimits-bodycontainer-middle">
                            <div className="aviator-gamelimits-bodycontainer-right">
                                Maximum Cash out X:
                            </div>
                            <div className="aviator-gamelimits-bodycontainer-left">8.99</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
