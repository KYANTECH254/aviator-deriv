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
    
    // Filter out manual accounts
    const filteredAccounts = storedAccounts.filter((account: any) => {
        const loginId = getAccountLoginId(account);
        return !loginId?.toLowerCase().startsWith('manual');
    });

    useEffect(() => {
        setSelectedAccount(getAccountLoginId(activeAccount) || getAccountLoginId(filteredAccounts[0]) || null);
    }, [activeAccount, filteredAccounts]);

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
        // Only allow USD accounts
        if (account.currency !== 'USD') {
            return;
        }
        
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
                            {filteredAccounts.length === 0 ? (
                                <div className="no-accounts-message">
                                    No accounts available
                                </div>
                            ) : (
                                filteredAccounts.map((account) => {
                                    const tokenShort = account.token?.slice(0, 8).toUpperCase();
                                    const loginId = getAccountLoginId(account) || tokenShort || "Unknown";
                                    const accountKey = account.loginid || account.code || account.accountId || tokenShort || loginId;

                                    const isDisabled = account.currency !== 'USD';
                                    
                                    return (
                                        <div
                                            key={accountKey}
                                            className={`aviator-popup-accounts-box display-center ${selectedAccount === loginId ? "selected" : ""}${isDisabled ? " disabled" : ""}`}
                                            onClick={() => handleAccountClick(account)}
                                            style={isDisabled ? { opacity: '0.5', cursor: 'not-allowed' } : {}}
                                            title={isDisabled ? 'Only USD accounts are supported' : ''}
                                        >
                                            <div className="account-details">
                                                <div className="account-loginid" style={{ fontSize: '14px', fontWeight: '600' }}>{loginId}</div>
                                                <div className="account-currency" style={{ fontSize: '12px', fontWeight: '500' }}>{account.currency}</div>
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
