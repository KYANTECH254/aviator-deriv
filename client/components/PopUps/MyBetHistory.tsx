"use client";

import { useAlert } from "@/context/AlertContext";
import { useEffect, useState, useRef, MouseEvent } from "react";

interface Bet {
    id: string;
    code: string;
    appId: string;
    multiplier: number;
    bet_amount: number;
    createdAt: string;
    profit: number;
    status: "won" | "lost";
}

interface ActiveAccount {
    code: string;
    derivId: string;
    currency: string;
    loginid?: string;
    accountId?: string;
    appId?: string;
}

interface MyBetHistoryProps {
    onClose: () => void;
    activeAccount: ActiveAccount;
    BetData: Record<string, Bet>;
}

export default function MyBetHistory({
    onClose,
    activeAccount,
    BetData,
}: MyBetHistoryProps) {
    const [filteredBets, setFilteredBets] = useState<Bet[]>([]);
    const [visibleBets, setVisibleBets] = useState<Bet[]>([]);
    const [loading, setLoading] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);
    const { addAlert } = useAlert()

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

    useEffect(() => {
        if (BetData && activeAccount) {
            const accountCode = activeAccount.loginid || activeAccount.code || activeAccount.accountId;
            const accountAppId = activeAccount.derivId || activeAccount.appId;
            const allBets = Object.values(BetData);
            const filtered = allBets.filter(
                (bet) =>
                    (bet.code === accountCode || bet.code === activeAccount.code) &&
                    bet.appId === accountAppId
            );
            setFilteredBets(filtered);
            setVisibleBets(filtered.slice(0, 10));
        }
    }, [BetData, activeAccount]);

    const getMultiplierClass = (multiplier: number) => {
        if (multiplier < 2) return "small";
        if (multiplier >= 2 && multiplier < 10) return "medium";
        return "large";
    };

    const loadMoreBets = () => {
        setLoading(true);
        setTimeout(() => {
            setVisibleBets((prevBets) => [
                ...prevBets,
                ...filteredBets.slice(prevBets.length, prevBets.length + 10),
            ]);
            setLoading(false);
        }, 1000);
    };

    const handleCopyBetId = (id: any) => {
        const message = `share_bet:${id}:`;
        navigator.clipboard.writeText(message).then(() => {
            addAlert('Copied for chat!', 3000, 'green', 1, false);
        }).catch((err) => {
            console.error('Failed to copy: ', err);
            addAlert('Failed to copy!', 3000, 'red', 1, false);
        });
    };

    return (
        <div id="aviator-bethistory-tab" className="aviator-popup-container">
            <div ref={popupRef} className="aviator-gamelimits-popup">
                <div className="aviator-popup-header">
                    <div className="aviator-popup-header-left">MY BET HISTORY</div>
                    <div
                        onClick={onClose}
                        id="aviator-bethistory-popup-close"
                        className="aviator-popup-header-right"
                    >
                        <i className="fa fa-times" aria-hidden="true"></i>
                    </div>
                </div>
                <div className="aviator-popup-bethistory-body">
                    <div className="aviator-bets-third-header">
                        <div className="aviator-bets-third-sub-header">User</div>
                        <div className="aviator-bets-third-sub-header">
                            Bet {activeAccount?.currency} x
                        </div>
                        <div className="aviator-bets-third-sub-header">
                            Cash out {activeAccount?.currency}
                        </div>
                    </div>

                    {loading ? (
                        <div
                            className="display-center column"
                            style={{ width: "100%" }}
                        >
                            <div className="popup-loader"></div>
                        </div>
                    ) : (
                        visibleBets
                        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((bet) => {
                            const formattedMultiplier = parseFloat(
                                bet.multiplier.toString()
                            ).toFixed(2);
                            const multiplierClass = getMultiplierClass(
                                parseFloat(formattedMultiplier)
                            );
                            const profitFormatted = bet.profit;

                            const totalFormatted = (profitFormatted + bet.bet_amount).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            });
                            return (
                                <div
                                    key={bet.id}
                                    className={`aviator-bet-item ${bet.status === "won" ? "won" : ""
                                        }`}
                                >
                                    <div className="aviator-bets-body-left-date rowgp5">
                                        <div className="aviator-bets-datetime">
                                            {new Date(
                                                bet.createdAt
                                            ).toLocaleTimeString()}
                                        </div>
                                        <div className="aviator-bets-date">
                                            {new Date(
                                                bet.createdAt
                                            ).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="aviator-bets-body-middle colgp5">
                                        <div className="aviator-bets-stake">
                                            {bet.bet_amount.toLocaleString(
                                                undefined,
                                                {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                }
                                            )}
                                        </div>

                                        {parseFloat(formattedMultiplier) > 0 && (<>
                                            <div className={`aviator-bets-multiplier ${multiplierClass}`}>
                                                {formattedMultiplier}x
                                            </div>
                                        </>)}
                                    </div>
                                    <div className="aviator-bets-body-right">
                                        <div className="aviator-bets-cashout">
                                            {totalFormatted}
                                        </div>
                                        <div className="aviator-bets-btns" onClick={() => handleCopyBetId(bet.id)}>
                                            <i
                                                className="fa fa-comment-o"
                                                aria-hidden="true"
                                            ></i>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="aviator-bethistory-popup-footer">
                    <div
                        id="aviator-bethistory-loadmore"
                        className="aviator-bethistory-loadbtn"
                        onClick={loadMoreBets}
                    >
                        Load more
                    </div>
                </div>
            </div>
        </div>
    );
}
