"use client"

import { useEffect, useRef } from "react";

export default function ProvablyFair({ onClose }: any) {
    const popupRef = useRef<HTMLDivElement>(null);

    const handleOutsideClick = (event: any) => {
        // Close popup if clicked outside of the popup
        if (popupRef.current && !popupRef.current.contains(event.target)) {
            onClose();
        }
    };

    useEffect(() => {
        // Add event listener to detect outside clicks
        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            // Cleanup the event listener on component unmount
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);
    return (
        <>
            <div id="aviator-provably-tab" className="aviator-popup-container">
                <div ref={popupRef} className="aviator-provably-popup">
                    <div className="aviator-provably-header">
                        <div className="aviator-popup-header-left">WHAT IS PROVABLY FAIR?</div>
                        <div onClick={onClose} id="aviator-provably-popup-close" className="aviator-popup-header-right"><i className="fa fa-times"
                            aria-hidden="true"></i></div>
                    </div>
                    <div className="aviator-provably-popup-body">
                        <div className="aviator-provably-popup-body-header">
                            <img src="assets/images/provablyfair.png" alt="Provably Fair" />
                            Provably Fair - 100% FAIR GAME
                        </div>

                        <div className="aviator-provably-popup-body-section1">
                            "Aviator" is based on cryptographic technology called "Provably Fair". This technology
                            guarantees
                            100% fairness of game result. With this technology, it's impossible for any third party to
                            interfere
                            in game process.
                        </div>
                        <div className="aviator-provably-popup-body-title">
                            HOW IT WORKS
                        </div>
                        <div className="aviator-provably-popup-body-subtitle">
                            Quick explanation:
                        </div>
                        <div className="avitor-provably-body-text">
                            Result of each round (Game's "Fly away" multiplier ) is not generated on our servers. It's
                            generated
                            with help of round players and is fully transparent. This way, it's impossible for anyone to
                            manipulate game output. Also, anyone can check and confirm game fairness
                        </div>
                        <div className="aviator-provably-popup-body-subtitle">
                            More information:
                        </div>
                        <div className="avitor-provably-body-text">
                            Round result is generated from four independent participants of the round: game operator and
                            first 3
                            betters of the round. Operator is generating server seed (random 16 symbols). Hashed version of
                            this
                            server seed is available publicly before round starts (In user menu, check "Provably Fair
                            Settings"
                            and then "Next server seed SHA256") Client seed is generated on the side of each player and when
                            round starts first 3 betters are participating in generating round result.
                        </div>
                        <div className="avitor-provably-body-text">
                            When round starts, game merges server seed with three client seeds. From merged symbols is
                            generated
                            SHA512 hash, and from this hash - game result.
                        </div>
                        <div className="aviator-provably-body-img">
                            <img src="assets/images/topprovablystep.png" alt="Provably Fair" />
                            <img src="assets/images/bottomprovablystep.png" alt="Provably Fair" />
                        </div>
                        <div className="aviator-provably-popup-body-title">
                            HOW TO CHECK
                        </div>
                        <div className="avitor-provably-body-text">
                            - You can check fairness of each round from game history, by clicking on green icon.
                        </div>
                        <div className="avitor-provably-body-text">
                            - In opened window, you will see server seed, 3 pair of players seeds, combined hash and round
                            result.
                        </div>
                        <div className="avitor-provably-body-text">
                            - Hashed version of next rounds server seed is available publicly in settings window (In user
                            menu,
                            check "Provably Fair Settings" and then "Next server seed SHA256"). You can also change your
                            client
                            seed here.
                        </div>
                        <div className="avitor-provably-body-text">
                            - If you want to participate in round result generation, make sure you are between first 3
                            players
                            who make bet in that round.
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}