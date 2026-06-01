"use client"

import { useEffect, useRef, useState } from "react";
import ProvablyFair from "./ProvablyFair";

export default function ProvablyFairSettings({ onClose }: any) {
    const popupRef = useRef<HTMLDivElement>(null);
    const [isChangeSeedOpen, setisChangeSeedOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('random');
    const [isProvablyFairVisible, setProvablyFairVisible] = useState(false); 

    const handleProvablyFairToggle = () => {
        setProvablyFairVisible(prevState => !prevState);
    };

    const handleChangeSeedToggle = () => {
        setisChangeSeedOpen(prevState => !prevState);
    };

    const handleTabClick = (tabName: any) => {
        setActiveTab((prevTab) => (prevTab === tabName ? null : tabName));
    };

    // const handleOutsideClick = (event: any) => {
    //     // Close popup if clicked outside of the popup
    //     if (popupRef.current && !popupRef.current.contains(event.target)) {
    //         onClose();
    //     }
    // };

    // useEffect(() => {
    //     // Add event listener to detect outside clicks
    //     document.addEventListener("mousedown", handleOutsideClick);
    //     return () => {
    //         // Cleanup the event listener on component unmount
    //         document.removeEventListener("mousedown", handleOutsideClick);
    //     };
    // }, []);
    return (
        <>
            <div id="aviator-settings-tab" className="aviator-popup-container">
                <div ref={popupRef} className="aviator-settings-popup">
                    <div className="aviator-popup-header">
                        <div className="aviator-popup-header-left">PROVABLY FAIR SETTING</div>
                        <div onClick={onClose} id="aviator-settings-popup-close" className="aviator-popup-header-right"><i className="fa fa-times"
                            aria-hidden="true"></i></div>
                    </div>
                    <div className="aviator-settings-popup-body">
                        <div className="aviator-settings-popup-body-top">
                            <div className="aviator-settings-text">
                                This game uses Provably Fair technology to determine game result. This tool gives you
                                ability to
                                change your seed and check fairness of the game.
                            </div>
                            <div onClick={handleProvablyFairToggle} id="provably-btn" className="aviator-provably-text">
                                <i className="fa fa-question-circle-o" aria-hidden="true"></i>
                                What is Provably Fair
                            </div>
                        </div>
                        <div className="aviator-settings-popup-body-middle">
                            <div className="aviator-settings-popup-body-middle-heading-top">
                                <div className="aviator-settings-popup-body-middle-heading">
                                    <img src="assets/images/client.png" alt="Client" />
                                    Client (your) seed:
                                </div>
                                <div className="aviator-settings-text2">
                                    Round result is determined form combination of server seed and first 3 bets of the
                                    round.
                                </div>
                            </div>

                            <div id="aviator-settings-tab1" className={`aviator-settings-input-field ${activeTab !== 'random' ? 'inactive' : ''}`}>
                                <label className="settings-checkbox">
                                    <input checked={activeTab === "random"} type="checkbox" id="checkbox2" onChange={() => handleTabClick('random')}/>
                                    <span className="checkmark"><i className="fa fa-circle" aria-hidden="true"></i></span>
                                    Random on every new game
                                </label>
                                <div className="aviator-server-seed-firstinput">
                                    <div className="aviator-first-input-label">Current:</div>
                                    <input id="settings-input" type="text" readOnly />
                                    <i id="settings-copy-btn" className="fa fa-files-o" aria-hidden="true"></i>
                                </div>
                            </div>

                            <div id="aviator-settings-tab2" className={`aviator-settings-input-field mb2 ${activeTab !== 'static' ? 'inactive' : ''}`}>
                                <label className="settings-checkbox">
                                    <input checked={activeTab === 'static'} type="checkbox" id="checkbox3" onChange={() => handleTabClick('static')} />
                                    <span className="checkmark"><i className="fa fa-circle" aria-hidden="true"></i></span>
                                    Enter manually
                                </label>
                                <div className="aviator-server-seed-secondinput">
                                    <div className="aviator-first-input-label">Current:</div>
                                    <input id="settings-input2" type="text" defaultValue="2MM7L9UTcjfVCV6iO9ZE-17" readOnly />
                                    <i id="settings-copy-btn2" className="fa fa-files-o" aria-hidden="true"></i>
                                </div>
                                <button
                                    onClick={handleChangeSeedToggle}
                                    id="aviator-seed-btn"
                                    className="aviator-settings-button">CHANGE</button>
                            </div>

                        </div>
                        <div className="aviator-settings-popup-body-bottom">
                            <div className="aviator-settings-popup-body-bottom-top">
                                <img src="assets/images/server.png" alt="Server" />
                                Server seed SHA256:
                            </div>
                        </div>
                        <div id="serverseed" className="aviator-server-seed-input">
                            <input type="text"
                                readOnly />
                        </div>

                    </div>
                    <div className="aviator-avatar-popup-footer">
                        <div className="aviator-settings-footer-text">
                            You can check fairness of each bet from bet history.
                        </div>
                    </div>
                </div>
            </div>

            {isProvablyFairVisible && <ProvablyFair onClose={handleProvablyFairToggle} />}
        </>
    )
}