"use client"


import { useEffect, useRef, MouseEvent } from "react";

interface GameRulesProps {
    onClose: () => void;
}

export default function GameRules({ onClose }: GameRulesProps) {
    const popupRef = useRef<HTMLDivElement>(null);
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
    });

    return (
        <div id="aviator-rules-tab" className="aviator-popup-container">
            <div ref={popupRef} className="aviator-rules-popup">
                <div className="aviator-popup-header">
                    <div className="aviator-popup-header-left">GAME RULES</div>
                    <div onClick={onClose} id="aviator-rules-popup-close" className="aviator-popup-header-right"><i className="fa fa-times"
                        aria-hidden="true"></i></div>
                </div>
                <div className="aviator-rules-popup-body">
                    <div className="aviator-rules-text">
                        Aviator is a new generation of iGaming entertainment. You can win many times more, in seconds!
                    </div>
                    <div className="aviator-provably-link">
                        <a href="https://aviator-next.spribegaming.com/#"> Read more about provably fair system </a>
                    </div>
                    <div className="aviator-rules-heading">
                        HOW TO PLAY
                    </div>
                    <iframe width="100%" height="432"
                        src="https://www.youtube.com/embed/PZejs3XDCSY"
                        title="Spribe Aviator - How to play?" frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin" allowFullScreen>
                    </iframe>
                    <div className="aviator-rules-heading mt4 mb2">
                        Aviator is as easy to play as 1-2-3:
                    </div>
                    <div className="aviator-rules-img">
                        <img src="assets/images/1step.png" alt="Steps" />
                        <img src="assets/images/2step.png" alt="Steps" />
                        <img src="assets/images/3step.png" alt="Steps" />
                    </div>
                    <div className="aviator-rules-text mt2 mb3">
                        But remember, if you did not have time to Cash Out before the Lucky Plane flies away, your bet
                        will
                        be lost. Aviator is pure excitement! Risk and win. It’s all in your hands!
                    </div>
                    <div className="aviator-rules-heading">
                        More details
                    </div>
                    <div className="aviator-paragraph-text">
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            The win multiplier starts at 1x and grows more and more as the Lucky Plane takes off.
                        </div>
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            Your winnings are calculated at the multiplier at which you made a Cash Out, multiplied by
                            your
                            bet.
                        </div>
                    </div>
                    <div className="aviator-rules-heading mt4">
                        GAME FUNCTIONS
                    </div>
                    <div className="aviator-rules-heading">
                        Bet & Cash Out
                    </div>
                    <div className="aviator-paragraph-text">
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            Select an amount and press the “Bet” button to make a bet.
                        </div>
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            You can cancel the bet by pressing the &quot;Cancel&quot; button if the round has not yet started.
                        </div>
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            Adjust the bet size using the &quot;+&quot; and &quot;-&quot; buttons to change the bet amount. Alternatively,
                            you
                            can select the bet size using the preset values or enter a value manually.
                        </div>
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            You can make two bets simultaneously, by adding a second bet panel. To add a second bet
                            panel,
                            press the plus icon, which is located on the top right corner of the first bet panel.
                        </div>
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            Press the “Cash Out” button to cash out your winnings. Your win is your bet multiplied by
                            the
                            Cash Out multiplier.
                        </div>
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            Your bet is lost, if you didn’t cash out before the plane flies away.
                        </div>
                    </div>

                    <div className="aviator-rules-heading">Auto Play & Auto Cash Out</div>
                    <div className="aviator-paragraph-text">
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            Before starting Auto Play, select the bet size you want to play with. How to do this is
                            described in the Bet & cash out section.
                        </div>
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            Auto Play is activated from the “Auto” tab in the Bet Panel, by checking the “Auto Bet”
                            checkbox. After activation, bets will be placed automatically, but for Cash Out, you should
                            press the “Cash Out” button in each round. If you want the bet to cash out automatically,
                            then
                            use the “Auto Cash Out” option
                        </div>
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            Auto Cash Out is available from the “Auto” tab on the Bet panel. After activation, your bet
                            will
                            be automatically cashed out when it reaches the multiplier entered
                        </div>
                    </div>

                    <div className="aviator-rules-heading">Live Bets & Statistics</div>
                    <div className="aviator-paragraph-text">
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            On the left side of the game interface (or under the Bet Panel on mobile), is located the
                            Live
                            Bets panel. Here you can see all bets that are being made in the current round.
                        </div>
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            In the “My Bets” panel you can see all of your bets and Cash Out information.
                        </div>
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            In the “Top” panel, game statistics are located. You can browse wins by amount, or Cash Out
                            multiplier, and see the biggest round multipliers.
                        </div>
                    </div>

                    <div className="aviator-rules-heading">In-Game Chat</div>
                    <div className="aviator-paragraph-text">
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            On the right side of the game interface (or after pressing the Chat icon, on the top right
                            corner of the mobile interface), the Chat Panel is located. In Chat, you can communicate
                            with
                            other players. Also, information about huge wins is posted in the Chat automatically.
                        </div>
                    </div>

                    <div className="aviator-rules-heading">Game Menu</div>
                    <div className="aviator-paragraph-text">
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            Access the game menu by tapping the menu button in the top right corner of the screen.
                        </div>
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            Toggle the &quot;Sound&quot; switch to turn the game sounds on or off.
                        </div>
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            Toggle the &quot;Music&quot; switch to turn the background music on or off.
                        </div>
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            Toggle the &quot;Animation&quot; switch to turn the airplane animation on or off.
                        </div>
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            Press the &quot;Limits&quot; button to view the limits for minimum and maximum bets, as well as the
                            maximum win limit.
                        </div>
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            Press the &quot;My Bets History&quot; button to view the history of your bets
                        </div>
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            Open &quot;Game Rules&quot; to read detailed rules of the game
                        </div>
                    </div>

                    <div className="aviator-rules-heading">Other</div>
                    <div className="aviator-paragraph-text">
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            If the internet connection is interrupted when the bet is active, the game will auto cash
                            out
                            with the current multiplier, and the winning amount will be added to your balance.
                        </div>
                        <div className="aviator-paragraph-sentence">
                            <i className="fa fa-chevron-right rules-icon" aria-hidden="true"></i>
                            In the event of a malfunction of the gaming hardware/software, all affected game bets and
                            payouts are rendered void and all affected bets are refunded.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}