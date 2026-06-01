"use client"

import useStoredAccounts from "@/hooks/useStoredAccounts";
import { DeleteCookie, SetCookie } from "@/lib/Functions";
import { useEffect, useRef, useState } from "react";

const getAccountLoginId = (account: any) =>
    account?.loginid || account?.login_id || account?.code || account?.accountId || account?.account_id || "";

export default function FreeBets({ onClose, onToggleActiveAccount }: any) {
    const popupRef = useRef<HTMLDivElement>(null);
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
    const { activeAccount, storedAccounts, toggleActiveAccount } = useStoredAccounts()

    useEffect(() => {
        setSelectedAccount(getAccountLoginId(activeAccount) || getAccountLoginId(storedAccounts[0]) || null);
    }, [activeAccount, storedAccounts]);

    const handleOutsideClick = (event: any) => {
        if (popupRef.current && !popupRef.current.contains(event.target)) {
            onClose();
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);

    const handleAccountClick = (account: any) => {
        setSelectedAccount(getAccountLoginId(account));
        toggleActiveAccount(account)
        onToggleActiveAccount(account)

        const token = account.authToken || account.token;

        if (token) {
            DeleteCookie("token");
            SetCookie(token)
        }
    };

    return (
        <div id="aviator-freebets-tab" className="aviator-popup-container">
            <div ref={popupRef} className="aviator-freebets-popup">
                <div className="aviator-popup-header">
                    <div className="aviator-popup-header-left">MY DERIV ACCOUNTS</div>
                    <div onClick={onClose} id="aviator-popup-close" className="aviator-popup-header-right">
                        <i className="fa fa-times" aria-hidden="true"></i>
                    </div>
                </div>
                <div id="free-bets-tab" className="aviator-popup-freebets-body">
                    <div className="aviator-popup-freebets-body-container display-center">
                        <div className="aviator-popup-freebets-body-container-bottom display-center">
                            {storedAccounts.length === 0 ? (
                                <div className="no-accounts-message">
                                    No accounts available
                                </div>
                            ) : (
                                storedAccounts.map((account) => {
                                    const tokenShort = account.token?.slice(0, 8).toUpperCase();
                                    const loginId = getAccountLoginId(account) || tokenShort || "Unknown";
                                    const accountKey = account.loginid || account.code || account.accountId || tokenShort || loginId;

                                    return (
                                        <div
                                            key={accountKey}
                                            className={`aviator-popup-accounts-box display-center ${selectedAccount === loginId ? "selected" : ""}`}
                                            onClick={() => handleAccountClick(account)}
                                        >
                                            <div className="account-details">
                                                <div className="account-loginid">{loginId}</div>
                                                <div className="account-currency">{account.currency}</div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
