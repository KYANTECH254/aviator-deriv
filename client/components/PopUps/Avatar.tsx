"use client";


import useAvatar from "@/hooks/useAvatars";
import { useEffect, useRef, useState } from "react";

export default function Avatar({ onClose, onAvatarUpdate }: { onClose: () => void; onAvatarUpdate: (avatar: string) => void }) {
    const popupRef = useRef<HTMLDivElement>(null);
    const { avatar } = useAvatar();
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

    useEffect(() => {
        if (avatar) {
            setSelectedAvatar(avatar); 
        }
    }, [avatar]);

    const handleOutsideClick = (event: MouseEvent) => {
        if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
            onClose();
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);

    const handleAvatarClick = (avatarPath: string) => {
        onAvatarUpdate(avatarPath);
        setSelectedAvatar(avatarPath); 
    };

    return (
        <div id="aviator-avatar-tab" className="aviator-popup-container">
            <div ref={popupRef} className="aviator-avatar-popup">
                <div className="aviator-popup-header">
                    <div className="aviator-popup-header-left">CHOOSE GAME AVATAR</div>
                    <div onClick={onClose} id="aviator-avatar-popup-close" className="aviator-popup-header-right">
                        <i className="fa fa-times" aria-hidden="true"></i>
                    </div>
                </div>
                <div className="aviator-avatar-popup-body">
                    <div id="avatarContainer" className="avatar-grid">
                        {[...Array(72)].map((_, index) => {
                            const avatarSrc = `assets/images/av-${index + 1}.png`;
                            return (
                                <img
                                    key={index}
                                    src={avatarSrc}
                                    alt={`Avatar ${index + 1}`}
                                    onClick={() => handleAvatarClick(avatarSrc)}
                                    className={`avatar-item ${selectedAvatar === avatarSrc ? "active" : ""}`}
                                />
                            );
                        })}
                    </div>
                </div>
                <div className="aviator-avatar-popup-footer">
                    <div onClick={onClose} className="aviator-popup-closebtn">Close</div>
                </div>
            </div>
        </div>
    );
}
