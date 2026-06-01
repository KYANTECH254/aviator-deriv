"use client"

import useStoredAccounts from "@/hooks/useStoredAccounts";
import { DeleteCookie, SetCookie } from "@/lib/Functions";
import { useEffect, useRef, useState } from "react";

export default function FreeBets({ onClose, onToggleActiveAccount }: any) {
    const popupRef = useRef<HTMLDivElement>(null);
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
    const { activeAccount, storedAccounts, toggleActiveAccount } = useStoredAccounts()
    const activeAccountRef = useRef(activeAccount)

    useEffect(() => {
        activeAccountRef.current = activeAccount      
    }, [activeAccount])

    const safeJSONParse = (value: string | null, fallback: any) => {
        if (!value || value === 'undefined' || value === 'null') return fallback;
        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    };

    useEffect(() => {
        const storedAccounts = sessionStorage.getItem("accounts");
        const storedActiveAccount = sessionStorage.getItem("activeAccount");

        const parsedActive = safeJSONParse(storedActiveAccount, null);
        if (parsedActive) {
            setSelectedAccount(parsedActive.code);
            toggleActiveAccount(parsedActive);
        }

        const parsedAccounts = safeJSONParse(storedAccounts, []);
        if (Array.isArray(parsedAccounts) && parsedAccounts.length > 0) {
            setSelectedAccount(activeAccountRef.current?.code || parsedAccounts[0].code);
        } else {
            setSelectedAccount(null);
        }

    }, [selectedAccount]);

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
        setSelectedAccount(account.code);
        toggleActiveAccount(account)
        onToggleActiveAccount(account)
        if (DeleteCookie("token")) {
            SetCookie(account.authToken)
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
                                    const loginId = account.loginid || tokenShort || account.code || account.accountId || "Unknown";
                                    const accountKey = account.loginid || account.code || account.accountId || tokenShort || loginId;

                                    return (
                                        <div
                                            key={accountKey}
                                            className={`aviator-popup-accounts-box display-center ${selectedAccount === account.code ? "selected" : ""}`}
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
