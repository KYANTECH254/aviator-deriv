import { useAlert } from "@/context/AlertContext";
import { useEffect, useState } from "react";

export default function AllBets({ activeAccount, AllbetsData, Multipliers, socket, LiveBetsData, UpdatedBetData }: any) {
    const [activeTab, setActiveTab] = useState('live-bets');
    const [activeSubTab, setActiveSubTab] = useState('huge-wins');
    const [activeSubMiniTab, setActiveSubMiniTab] = useState('day-bets');
    const [activeRound, setActiveRound] = useState<any>('');

    const [loading, setLoading] = useState(true);
    const [MyBets, setMyBets] = useState<any[]>([]);
    const [filteredMultipliers, setFilteredMultipliers] = useState<any[]>([]);
    const [filteredHugeWins, setFilteredHugeWins] = useState<any[]>([]);
    const [filteredBiggestWins, setFilteredBiggestWins] = useState<any[]>([]);
    const [liveBets, setLiveBets] = useState<any[]>([]);
    const [previousBets, setPreviousBets] = useState<any[]>([]); // For storing previous round's bets
    const [totalBets, setTotalBets] = useState<number>(0); // Total bets for the current round
    const [previousTotalBets, setPreviousTotalBets] = useState<number>(0); // Total bets for the previous round
    const [currentRoundId, setCurrentRoundId] = useState<any>(''); // Current round ID
    const [previousRoundId, setPreviousRoundId] = useState<any>('');
    const [PrevMultiplier, setPrevMultiplier] = useState<any>('');

    const { addAlert } = useAlert();

    useEffect(() => {
        if (activeTab === 'live-bets') {
            setActiveRound("current")
        } else if (activeTab !== 'live-bets') {
            setActiveRound('')
        }
    }, [activeTab]);

    useEffect(() => {
        function getPreviousRoundIdFromClientData(multipliersData: any) {
            if (multipliersData.length >= 2) {
                return multipliersData[multipliersData.length - 2].id;
            }
            return null;
        }

        const previousRoundId = getPreviousRoundIdFromClientData(Multipliers);
        setPreviousRoundId(previousRoundId);
    }, [activeRound])

    useEffect(() => {
        setLoading(true);

        if (LiveBetsData) {
            const { round_id, bets, totalBetsCount, previousRoundBets, totalPreviousBetsCount } = LiveBetsData;

            if (Array.isArray(bets)) {
                const isNewRound = currentRoundId !== round_id;

                if (isNewRound) {
                    // console.log(`New round detected: ${round_id}. Using all data fetched from the database.`);

                    // Set previous round data directly from the database
                    setPreviousBets(previousRoundBets || []); // Previous bets directly from DB
                    setPreviousRoundId(previousRoundBets?.length > 0 ? previousRoundBets[0].round_id : ''); // Assume round_id exists in previous bets
                    setPreviousTotalBets(totalPreviousBetsCount || 0); // Set total count of previous bets

                    // Set the current round data
                    setLiveBets(bets || []); // Set all bets for the current round
                    setCurrentRoundId(round_id); // Update current round ID
                    setTotalBets(totalBetsCount || bets.length); // Update total bets count
                } else {
                    // console.log(`Same round detected: ${round_id}. No appending needed.`);
                    // If the round is the same, assume the data is already complete from the database.
                    setLiveBets(bets || []);
                    setTotalBets(totalBetsCount || bets.length);
                }
            } else {
                setLiveBets([]);
                setTotalBets(0);
            }

            setLoading(false);
        }
    }, [LiveBetsData, activeTab, currentRoundId]);

    useEffect(() => {
        if (activeTab === 'live-bets' && UpdatedBetData) {
            setLiveBets((prevBets) => {
                if (!Array.isArray(prevBets)) return [UpdatedBetData];

                const existingBetIndex = prevBets.findIndex((bet) => bet.id === UpdatedBetData.id);
                if (existingBetIndex !== -1) {
                    const updatedBets = [...prevBets];
                    updatedBets[existingBetIndex] = UpdatedBetData;
                    return updatedBets;
                }

                return [UpdatedBetData, ...prevBets];
            });

            setTotalBets((prevTotal) => {
                if (prevTotal === 0) {
                    return 0;
                }
                return prevTotal + 1;
            });
        }
    }, [UpdatedBetData, activeTab]);

    useEffect(() => {
        if (previousRoundId && Multipliers) {
            const filteredPreviousMultiplierValue = Multipliers.find((mul: any) =>
                String(mul.id) === String(previousRoundId)
            )?.value;
            setPrevMultiplier(filteredPreviousMultiplierValue);
        }
    }, [previousRoundId, Multipliers]);

    useEffect(() => {
        if (AllbetsData && activeAccount) {
            const accountCode = activeAccount.loginid || activeAccount.code || activeAccount.accountId;
            const accountAppId = activeAccount.derivId || activeAccount.appId;
            const filteredBets = AllbetsData.filter((bet: any) =>
                (bet.code === accountCode || bet.code === activeAccount.code) &&
                bet.appId === accountAppId
            ).reverse();

            setMyBets(filteredBets);
            setLoading(false);
        }
    }, [AllbetsData, activeAccount]);

    useEffect(() => {
        setLoading(true);
        let filtered: any[] = [];
        if (activeSubMiniTab === 'day-bets') {
            filtered = Multipliers.filter((multiplier: any) => isDailyBet(multiplier.createdAt));
        } else if (activeSubMiniTab === 'month-bets') {
            filtered = Multipliers.filter((multiplier: any) => isMonthlyBet(multiplier.createdAt));
        } else if (activeSubMiniTab === 'year-bets') {
            filtered = Multipliers.filter((multiplier: any) => isYearlyBet(multiplier.createdAt));
        }
        setFilteredMultipliers(sortAndLimitMultipliers(filtered));
        setLoading(false);
    }, [activeSubMiniTab, Multipliers]);

    useEffect(() => {
        filterHugeWins();
        filterBiggestWins();
    }, [AllbetsData, Multipliers, activeSubMiniTab, activeAccount]);

    const handleTabClick = (tab: any) => {
        setLoading(false)
        setActiveTab(tab);
    };

    const handleSubTabClick = (tab: any) => {
        setActiveSubTab(tab);
        setLoading(false)
    };

    const handleSubMiniTabClick = (tab: any) => {
        setActiveSubMiniTab(tab);
        setLoading(false)
    };

    const handleActiveRound = (round: any) => {
        setActiveRound("current");
    }

    // Function to handle displaying previous round's bets
    const handlePreviousRoundClick = () => {
        setActiveRound("previous")
    };

    // Function to determine multiplier size class
    const getMultiplierClass = (multiplier: number) => {
        if (multiplier < 2) return "small";
        if (multiplier >= 2 && multiplier < 10) return "medium";
        return "large"; // If multiplier >= 10
    };

    // Function to check if a date is within the last 24 hours (for daily bets)
    const isDailyBet = (createdAt: string) => {
        const now = new Date();
        const betDate = new Date(createdAt);
        const diff = now.getTime() - betDate.getTime();
        return diff <= 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    };

    // Function to check if a date is within the current month (for monthly bets)
    const isMonthlyBet = (createdAt: string) => {
        const now = new Date();
        const betDate = new Date(createdAt);
        return now.getFullYear() === betDate.getFullYear() && now.getMonth() === betDate.getMonth();
    };

    // Function to check if a date is within the current year (for yearly bets)
    const isYearlyBet = (createdAt: string) => {
        const now = new Date();
        const betDate = new Date(createdAt);
        return now.getFullYear() === betDate.getFullYear();
    };

    const sortAndLimitMultipliers = (multipliers: any[]) =>
        multipliers
            .sort((a, b) => parseFloat(b.value) - parseFloat(a.value))
            .slice(0, 15);

    const filterHugeWins = () => {
        setLoading(true);

        // Filter bets for the active app
        const appBets = AllbetsData.filter((bet: any) => bet.appId === activeAccount?.derivId);

        // Add round multiplier from multipliers model
        const betsWithMultiplier = appBets.map((bet: any) => {
            const roundMultiplier = Multipliers.find((multiplier: any) =>
                multiplier.id.toString() === bet.round_id.toString()
            )?.value;
            return { ...bet, roundMultiplier: roundMultiplier ? parseFloat(roundMultiplier) : 0 };
        });

        // Determine huge wins based on ratio range
        const THRESHOLD_RATIO = 5;
        const MAX_THRESHOLD_RATIO = 7.9;

        const hugeWins = betsWithMultiplier.filter((bet: any) => {
            const winAmount = bet.profit + bet.bet_amount;
            const ratio = winAmount / bet.bet_amount;
            return ratio >= THRESHOLD_RATIO && ratio <= MAX_THRESHOLD_RATIO;
        });

        // Sort huge wins by win amount (profit + bet amount) in descending order
        const sortedHugeWins = hugeWins.sort((a: any, b: any) => {
            const winAmountA = a.profit + a.bet_amount;
            const winAmountB = b.profit + b.bet_amount;
            return winAmountB - winAmountA; // Sort descending
        });

        // Filter by sub-tab time range
        let timeFilteredWins: any[] = [];
        if (activeSubMiniTab === 'day-bets') {
            timeFilteredWins = sortedHugeWins.filter((win: any) => isDailyBet(win.createdAt));
        } else if (activeSubMiniTab === 'month-bets') {
            timeFilteredWins = sortedHugeWins.filter((win: any) => isMonthlyBet(win.createdAt));
        } else if (activeSubMiniTab === 'year-bets') {
            timeFilteredWins = sortedHugeWins.filter((win: any) => isYearlyBet(win.createdAt));
        }

        setFilteredHugeWins(timeFilteredWins);
        setLoading(false);
    };

    const filterBiggestWins = () => {
        setLoading(true);

        // Filter bets for the active app
        const appBets = AllbetsData.filter((bet: any) => bet.appId === activeAccount?.derivId);

        // Add round multiplier from multipliers model
        const betsWithMultiplier = appBets.map((bet: any) => {
            const roundMultiplier = Multipliers.find((multiplier: any) =>
                multiplier.id.toString() === bet.round_id.toString()
            )?.value;
            return { ...bet, roundMultiplier: roundMultiplier ? parseFloat(roundMultiplier) : 0 };
        });

        // Define the threshold for biggest wins
        const BIGGEST_THRESHOLD_RATIO = 8;
        const biggestWins = betsWithMultiplier.filter((bet: any) => {
            const winAmount = bet.profit + bet.bet_amount;
            return winAmount >= bet.bet_amount * BIGGEST_THRESHOLD_RATIO;
        });

        // Sort biggest wins by win amount (profit + bet amount) in descending order
        const sortedBiggestWins = biggestWins.sort((a: any, b: any) => {
            const winAmountA = a.profit + a.bet_amount;
            const winAmountB = b.profit + b.bet_amount;
            return winAmountB - winAmountA; // Sort descending
        });

        // Filter by sub-tab time range
        let timeFilteredWins: any[] = [];
        if (activeSubMiniTab === 'day-bets') {
            timeFilteredWins = sortedBiggestWins.filter((win: any) => isDailyBet(win.createdAt));
        } else if (activeSubMiniTab === 'month-bets') {
            timeFilteredWins = sortedBiggestWins.filter((win: any) => isMonthlyBet(win.createdAt));
        } else if (activeSubMiniTab === 'year-bets') {
            timeFilteredWins = sortedBiggestWins.filter((win: any) => isYearlyBet(win.createdAt));
        }

        setFilteredBiggestWins(timeFilteredWins);
        setLoading(false);
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
        <section className="aviator-bets-section" id="aviator-bets-section">

            <div className="aviator-bets-section-sticky-headers">

                {/* <!-- Bets Section Main Header --> */}
                <div className="aviator-bets-header">
                    <div
                        className={`aviator-bets-sub-header ${activeTab === 'live-bets' ? 'active' : ''}`}
                        onClick={() => handleTabClick('live-bets')}
                    >
                        All Bets
                    </div>
                    <div
                        className={`aviator-bets-sub-header ${activeTab === 'my-bets' ? 'active' : ''}`}
                        onClick={() => handleTabClick('my-bets')}
                    >
                        My Bets
                    </div>
                    <div
                        className={`aviator-bets-sub-header ${activeTab === 'top-bets' ? 'active' : ''}`}
                        onClick={() => handleTabClick('top-bets')}
                    >
                        Top
                    </div>
                </div>

                {/* <!-- All Bets Live Header --> */}
                {activeTab === 'live-bets' && (
                    <div className="live-bets display-columns" id="live-bets">
                        <div className="aviator-bets-second-header">


                            {activeRound === 'current' && (
                                <>
                                    <div className="aviator-bets-second-header-left">
                                        <div className="aviator-bets-second-header-left-title">ALL BETS</div>
                                        <div className="aviator-bets-second-header-left-title-2">
                                            {totalBets.toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="aviator-bets-second-header-right">
                                        <div className="aviator-bets-second-header-right-btn" onClick={handlePreviousRoundClick}>
                                            <i className="fa fa-history" aria-hidden="true"></i>
                                            Previous hand
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeRound === 'previous' && (
                                <>
                                    <div className="aviator-bets-second-header-left">
                                        <div className="aviator-bets-second-header-left-title">ALL BETS</div>
                                        <div className="aviator-bets-second-header-left-title-2">
                                            {previousTotalBets.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="aviator-bets-second-header-middle">
                                        <div className={`aviator-bets-multiplier ${getMultiplierClass(PrevMultiplier)}`}>
                                            {PrevMultiplier}
                                        </div>

                                    </div>
                                    <div className="aviator-bets-second-header-right active">
                                        <div className="aviator-bets-second-header-right-btn" onClick={() => {
                                            handleActiveRound("current")
                                        }}>
                                            <i className="fa fa-times" aria-hidden="true"></i>
                                            Previous hand
                                        </div>
                                    </div>
                                </>
                            )}

                        </div>


                        <div className="aviator-bets-header-separator"></div>

                        {/* <!-- All Bets Header --> */}
                        <div className="aviator-bets-third-header my-bets-header">
                            <div className="aviator-bets-third-sub-header">User</div>
                            <div className="aviator-bets-third-sub-header">Bet {activeAccount?.currency} x</div>
                            <div className="aviator-bets-third-sub-header">Cash out {activeAccount?.currency}</div>
                        </div>
                    </div>
                )}

                {/* <!-- My Bets Header --> */}
                {activeTab === 'my-bets' && (
                    <div className="aviator-bets-third-header my-bets" id="my-bets">
                        <div className="aviator-bets-third-sub-header">Date</div>
                        <div className="aviator-bets-third-sub-header">Bet {activeAccount?.currency} x</div>
                        <div className="aviator-bets-third-sub-header">Cash out {activeAccount?.currency}</div>
                    </div>
                )}

                {/* <!-- Top Bets Header --> */}
                {activeTab === 'top-bets' && (
                    <div className="top-bets display-columns" id="top-bets">
                        <div className="aviator-bets-wins-header">
                            <div
                                className={`aviator-bets-wins-subheader ${activeSubTab === 'huge-wins' ? 'subheader-active' : ''}`}
                                id="huge-wins-btn"
                                onClick={() => handleSubTabClick('huge-wins')}>
                                HUGE WINS
                            </div>
                            <div
                                className={`aviator-bets-wins-subheader ${activeSubTab === 'biggest-wins' ? 'subheader-active' : ''}`}
                                id="biggest-wins-btn"
                                onClick={() => handleSubTabClick('biggest-wins')}>
                                BIGGEST WINS
                            </div>
                            <div
                                className={`aviator-bets-wins-subheader ${activeSubTab === 'multipliers' ? 'subheader-active' : ''}`}
                                id="multipliers-btn"
                                onClick={() => handleSubTabClick('multipliers')}>
                                MULTIPLIERS</div>
                        </div>

                        <div className="aviator-bets-header">
                            <div
                                className={`aviator-bets-sub-header ${activeSubMiniTab === 'day-bets' ? 'active' : ''}`}
                                id="day-bets-btn"
                                onClick={() => handleSubMiniTabClick('day-bets')}
                            >Day</div>
                            <div
                                className={`aviator-bets-sub-header ${activeSubMiniTab === 'month-bets' ? 'active' : ''}`}
                                id="month-bets-btn"
                                onClick={() => handleSubMiniTabClick('month-bets')}
                            >Month</div>
                            <div
                                className={`aviator-bets-sub-header ${activeSubMiniTab === 'year-bets' ? 'active' : ''}`}
                                id="year-bets-btn"
                                onClick={() => handleSubMiniTabClick('year-bets')}
                            >Year</div>
                        </div>

                        {/* <!-- Multipliers Header --> */}
                        <div className="multipliers-header" id="multipliers-header">
                            <div className="aviator-bets-third-header multipliers" id="multipliers">
                                <div className="aviator-bets-third-sub-header">Date</div>
                                <div className="aviator-bets-third-sub-header">X</div>
                                <div className="aviator-bets-third-sub-header">Fairness</div>
                            </div>
                        </div>

                    </div>
                )}
            </div>

            <div className="aviator-bets-section-scrollable">

                {/* <!-- All Bets -> Bet Item --> */}
                {activeTab === 'live-bets' && activeRound === 'current' && (
                    <div className="live-bets display-columns" id="live-bets">
                        {loading ? (
                            <div className="display-center">
                                <div className="popup-loader"></div>
                            </div>
                        ) : (
                            liveBets.length > 0 && (
                                liveBets
                                    .filter((bet: any) => {
                                        // Only include bets with valid fields
                                        return (
                                            bet.bet_amount &&
                                            !isNaN(bet.bet_amount) &&
                                            bet.avatar &&
                                            bet.username
                                        );
                                    })
                                    .sort((a, b) => b.bet_amount - a.bet_amount)
                                    .slice(0, 200)
                                    .map((bet: any, index: number) => {
                                        const formattedMultiplier = parseFloat(bet.multiplier).toFixed(2);
                                        const multiplierClass = getMultiplierClass(parseFloat(formattedMultiplier));

                                        // Format bet_amount
                                        const betAmountFormatted = bet.bet_amount.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        });

                                        // Format profit
                                        const profitFormatted = bet.profit;

                                        // Calculate total
                                        const totalFormatted = (profitFormatted + bet.bet_amount).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        });

                                        return (
                                            <div key={index} className="aviator-bets-body">
                                                <div className={`aviator-bet-item ${bet.status === "won" ? "won" : ""}`}>
                                                    <div className="aviator-bets-body-left">
                                                        <img
                                                            className="aviator-bets-avatar"
                                                            src={bet.avatar || "assets/images/avatar.png"}
                                                            alt="Avatar"
                                                        />
                                                        <div className="aviator-bets-username">
                                                            {bet.username || "2***6"}
                                                        </div>
                                                    </div>
                                                    <div className="aviator-bets-body-middle">
                                                        <div className="aviator-bets-stake">
                                                            {betAmountFormatted}
                                                        </div>
                                                        {parseFloat(formattedMultiplier) > 0 && (<>
                                                            <div className={`aviator-bets-multiplier ${multiplierClass}`}>
                                                                {formattedMultiplier}x
                                                            </div>
                                                        </>)}
                                                    </div>
                                                    <div className="aviator-bets-body-right">
                                                        {parseFloat(bet.multiplier) < 1 ? (
                                                            <div className="aviator-bets-cashout">
                                                                0
                                                            </div>
                                                        ) : (
                                                            <div className="aviator-bets-cashout">
                                                                {totalFormatted}
                                                            </div>
                                                        )}

                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                            )
                        )}
                    </div>
                )}

                {/* Display previous round bets */}
                {activeTab === 'live-bets' && activeRound === "previous" && (
                    <div className="previous-bets-list">
                        {loading ? (
                            <div className="display-center">
                                <div className="popup-loader"></div> {/* Loader for visual feedback */}
                            </div>
                        ) : (
                            previousBets.length > 0 && (
                                previousBets
                                    .filter((bet: any) => {
                                        // Only include bets with valid fields
                                        return (
                                            bet.bet_amount &&
                                            !isNaN(bet.bet_amount) &&
                                            bet.avatar &&
                                            bet.username
                                        );
                                    })
                                    .sort((a: any, b: any) => b.bet_amount - a.bet_amount)
                                    .map((bet: any, index: number) => {
                                        const formattedMultiplier = parseFloat(bet.multiplier).toFixed(2);
                                        const multiplierClass = getMultiplierClass(parseFloat(formattedMultiplier));

                                        // Format bet_amount
                                        const betAmountFormatted = bet.bet_amount.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        });

                                        // Format profit
                                        const profitFormatted = bet.profit;

                                        // Calculate total
                                        const totalFormatted = (profitFormatted + bet.bet_amount).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        });

                                        return (
                                            <div key={index} className="aviator-bets-body"> {/* Using index as key */}
                                                <div className={`aviator-bet-item ${bet.status === "won" ? "won" : ""}`}>
                                                    <div className="aviator-bets-body-left">
                                                        <img
                                                            className="aviator-bets-avatar"
                                                            src={bet.avatar || "assets/images/avatar.png"} // Fallback to a default avatar if missing
                                                            alt="Avatar"
                                                        />
                                                        <div className="aviator-bets-username">
                                                            {bet.username || "2***6"} {/* Fallback to a default username */}
                                                        </div>
                                                    </div>
                                                    <div className="aviator-bets-body-middle">
                                                        <div className="aviator-bets-stake">
                                                            {betAmountFormatted}
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
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                            )
                        )}
                    </div>
                )}

                {/* <!-- My Bets -> Bet Item --> */}
                {activeTab === 'my-bets' && (
                    <div className="my-bets display-columns" id="my-bets">
                        {loading ? (
                            <div className="display-center">
                                <div className="popup-loader"></div>
                            </div>
                        ) : (
                            MyBets
                                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .slice(0, 1000)
                                .map((bet: any) => {
                                    const formattedMultiplier = parseFloat(bet.multiplier).toFixed(2);
                                    const multiplierClass = getMultiplierClass(parseFloat(formattedMultiplier));

                                    return (
                                        <div key={bet.id} className="aviator-bets-body">
                                            <div className={`aviator-bet-item ${bet.status === "won" ? "won" : ""}`}>
                                                <div className="aviator-bets-body-left-date">
                                                    <div className="aviator-bets-datetime">{new Date(bet.createdAt).toLocaleTimeString()}</div>
                                                    <div className="aviator-bets-date">{new Date(bet.createdAt).toLocaleDateString()}</div>
                                                </div>
                                                <div className="aviator-bets-body-middle">
                                                    <div className="aviator-bets-stake">{(bet.bet_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                    {parseFloat(formattedMultiplier) > 1 && bet.status !== "open" && (
                                                        <>
                                                            <div className={`aviator-bets-multiplier ${multiplierClass}`}>{formattedMultiplier}x</div>
                                                        </>
                                                    )}

                                                </div>
                                                <div className="aviator-bets-body-right">
                                                    <div className="aviator-bets-cashout">{(bet.profit + bet.bet_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                    <div className="aviator-bets-btns" onClick={() => handleCopyBetId(bet.id)}>
                                                        <i className="fa fa-comment-o" aria-hidden="true"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                    </div>
                )}

                {/* <!-- Top Bets -> Bet Item --> */}
                {activeTab === 'top-bets' && (
                    <div className="top-bets display-columns" id="top-bets">

                        {activeSubTab === "huge-wins" && (
                            <div className="huge-wins display-columns" id="huge-wins">
                                <div className={`${activeSubMiniTab} display-columns`} id={`${activeSubMiniTab}`}>
                                    <div className="aviator-bets-body">
                                        {loading ? (
                                            <div className="display-center">
                                                <div className="popup-loader"></div>
                                            </div>
                                        ) : (
                                            filteredHugeWins
                                                .slice(0, 20)
                                                .map((bet: any, index: number) => (
                                                    <div className="aviator-top-bets" key={index}>
                                                        <div className="aviator-top-bets-1">
                                                            <div className="aviator-top-bets-1-left">
                                                                <img
                                                                    className="aviator-userinfo-img"
                                                                    src={bet.avatar || "assets/images/avatar.png"}
                                                                    alt="Avatar"
                                                                />
                                                                <div className="aviator-userinfo-username">{bet.username || "N/A"}</div>
                                                            </div>

                                                            <div className="aviator-top-bets-1-middle">
                                                                <div className="aviator-top-bets-1-middle-bet">
                                                                    Bet {activeAccount?.currency}: <span className="top-bets-span">{bet.bet_amount}</span>
                                                                </div>
                                                                <div className="aviator-top-bets-1-middle-cashout">
                                                                    Cashed out:{" "}
                                                                    <div className="aviator-bets-multiplier large">
                                                                        {bet.multiplier || "N/A"}x
                                                                    </div>
                                                                </div>
                                                                <div className="aviator-top-bets-1-middle-win">
                                                                    Win {activeAccount?.currency}: <span className="top-bets-span">{bet.profit}</span>
                                                                </div>
                                                            </div>

                                                            <div className="aviator-top-bets-1-right"></div>
                                                        </div>

                                                        <div className="aviator-top-bets-2">
                                                            <div className="aviator-top-bets-2-left">
                                                                <div className="aviator-top-bets-2-left-date">
                                                                    {new Date(bet.createdAt).toLocaleDateString()}
                                                                </div>
                                                                <div className="aviator-top-bets-2-left-round">
                                                                    Round: <span className="top-bets-span">{bet.roundMultiplier || "N/A"}</span>
                                                                </div>
                                                            </div>
                                                            <div className="aviator-top-bets-2-right" onClick={() => handleCopyBetId(bet.id)}>
                                                                <i className="fa fa-share" aria-hidden="true"></i>
                                                                <i className="fa fa-comment-o" aria-hidden="true"></i>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* <!-- Biggest Wins Object --> */}
                        {activeSubTab === 'biggest-wins' && (
                            <div className="biggest-wins display-columns" id="biggest-wins">
                                <div className={`${activeSubMiniTab} display-columns`} id={`${activeSubMiniTab}`}>
                                    <div className="aviator-bets-body">
                                        {loading ? (
                                            <div className="display-center">
                                                <div className="popup-loader"></div>
                                            </div>
                                        ) : (
                                            filteredBiggestWins
                                                .slice(0, 20)
                                                .map((bet: any, index: any) => (
                                                    <div className="aviator-top-bets" key={index}>
                                                        <div className="aviator-top-bets-1">
                                                            <div className="aviator-top-bets-1-left">
                                                                <img
                                                                    className="aviator-userinfo-img"
                                                                    src={bet.avatar || "assets/images/avatar.png"}
                                                                    alt="Avatar"
                                                                />
                                                                <div className="aviator-userinfo-username">
                                                                    {bet.username || 'N/A'}
                                                                </div>
                                                            </div>
                                                            <div className="aviator-top-bets-1-middle">
                                                                <div className="aviator-top-bets-1-middle-bet">
                                                                    Bet {activeAccount?.currency}: <span className="top-bets-span">{bet.bet_amount}</span>
                                                                </div>
                                                                <div className="aviator-top-bets-1-middle-cashout">
                                                                    Cashed out:
                                                                    <div className="aviator-bets-multiplier large">
                                                                        {bet.multiplier || "N/A"}x
                                                                    </div>
                                                                </div>
                                                                <div className="aviator-top-bets-1-middle-win">
                                                                    Win {activeAccount?.currency}: <span className="top-bets-span">{bet.profit}</span>
                                                                </div>
                                                            </div>
                                                            <div className="aviator-top-bets-1-right"></div>
                                                        </div>
                                                        <div className="aviator-top-bets-2">
                                                            <div className="aviator-top-bets-2-left">
                                                                <div className="aviator-top-bets-2-left-date">
                                                                    {new Date(bet.createdAt).toLocaleDateString()}
                                                                </div>
                                                                <div className="aviator-top-bets-2-left-round">
                                                                    Round: <span className="top-bets-span">{bet.roundMultiplier || "N/A"}</span>
                                                                </div>
                                                            </div>
                                                            <div className="aviator-top-bets-2-right" onClick={() => handleCopyBetId(bet.id)}>
                                                                <i className="fa fa-share" aria-hidden="true"></i>
                                                                <i className="fa fa-comment-o" aria-hidden="true"></i>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* <!-- Multipliers Object --> */}
                        {activeSubTab === 'multipliers' && (
                            <div className="multipliers display-columns" id="multipliers">

                                {loading ? (
                                    <div className="display-center">
                                        <div className="popup-loader"></div>
                                    </div>
                                ) : (
                                    <>
                                        {/* <!-- Top Bets -> Multiplier Bet Item Daily --> */}
                                        {activeSubMiniTab === 'day-bets' && (
                                            <div className="daily-bets display-columns" id="daily-bets">
                                                {filteredMultipliers
                                                    .slice(0, 20)
                                                    .map((multiplier: any) => (
                                                        <div key={multiplier.id} className="aviator-multipliers-body">
                                                            <div className="aviator-multiplier-body-left">
                                                                <div className="aviator-multiplier-body-left-date">
                                                                    {new Date(multiplier.createdAt).toLocaleString('en-GB', {
                                                                        weekday: 'short',
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                        second: '2-digit'
                                                                    })}
                                                                </div>
                                                            </div>
                                                            <div className="aviator-multiplier-body-left-middle">
                                                                <div className="aviator-multiplier-body-left-multiplier">
                                                                    {(multiplier.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x
                                                                </div>
                                                            </div>
                                                            <div className="aviator-multiplier-body-right">
                                                                {/* Any additional content for the right side */}
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}

                                        {/* <!-- Top Bets -> Multiplier Bet Item Monthly --> */}
                                        {activeSubMiniTab === 'month-bets' && (
                                            <div className="monthly-bets display-columns" id="monthly-bets">
                                                {filteredMultipliers
                                                    .slice(0, 20)
                                                    .map((multiplier: any) => (
                                                        <div key={multiplier.id} className="aviator-multipliers-body">
                                                            <div className="aviator-multiplier-body-left">
                                                                <div className="aviator-multiplier-body-left-date">
                                                                    {new Date(multiplier.createdAt).toLocaleString('en-GB', {
                                                                        weekday: 'short',
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                        second: '2-digit'
                                                                    })}
                                                                </div>
                                                            </div>
                                                            <div className="aviator-multiplier-body-left-middle">
                                                                <div className="aviator-multiplier-body-left-multiplier">
                                                                    {(multiplier.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x
                                                                </div>
                                                            </div>
                                                            <div className="aviator-multiplier-body-right">
                                                                {/* Any additional content for the right side */}
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}

                                        {/* <!-- Top Bets -> Multiplier Bet Item Yearly --> */}
                                        {activeSubMiniTab === 'year-bets' && (
                                            <div className="yearly-bets display-columns" id="yearly-bets">
                                                {filteredMultipliers
                                                    .slice(0, 20)
                                                    .map((multiplier: any) => (
                                                        <div key={multiplier.id} className="aviator-multipliers-body">
                                                            <div className="aviator-multiplier-body-left">
                                                                <div className="aviator-multiplier-body-left-date">
                                                                    {new Date(multiplier.createdAt).toLocaleString('en-GB', {
                                                                        weekday: 'short',
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                        second: '2-digit'
                                                                    })}
                                                                </div>
                                                            </div>
                                                            <div className="aviator-multiplier-body-left-middle">
                                                                <div className="aviator-multiplier-body-left-multiplier">
                                                                    {(multiplier.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x
                                                                </div>
                                                            </div>
                                                            <div className="aviator-multiplier-body-right">
                                                                {/* Any additional content for the right side */}
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}

                                    </>
                                )}
                            </div>

                        )}
                    </div>
                )}

            </div>

            <div className="aviator-bets-section-footer">
                <div className="aviator-bets-section-footer-right">
                    Powered by
                    <a href="https://topwebtools.online" className="aviator-bets-section-footer-right-text">TWT</a>
                </div>
            </div>

        </section>
    )
}