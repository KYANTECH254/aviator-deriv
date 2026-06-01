import { useEffect, useState } from "react";

export default function useAvatar () {
    const [avatar, setAvatar] = useState<string | null>(null);

    useEffect(() => {
        const storedAvatar = localStorage.getItem('userAvatar');
        
        if (storedAvatar) {
            setAvatar(storedAvatar);
        } else {
            const randomAvatarIndex = Math.floor(Math.random() * 72) + 1;
            const randomAvatar = `assets/images/av-${randomAvatarIndex}.png`;
            setAvatar(randomAvatar);
            localStorage.setItem('userAvatar', randomAvatar); 
        }
    }, []);

    const updateAvatar = (newAvatar: string) => {
        setAvatar(newAvatar);
        localStorage.setItem('userAvatar', newAvatar);
    };

    const removeAvatar = () => {
        setAvatar(null);
        localStorage.removeItem('userAvatar');
    };

    return { avatar, updateAvatar, removeAvatar };
};
