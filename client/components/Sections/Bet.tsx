import { useAlert } from "@/context/AlertContext";
import { useSession } from "@/context/SessionProvider";
import { useTrading } from "@/context/TradingContext";
import useUserInteraction from "@/hooks/useUserInteraction";
import { useEffect, useRef, useState } from "react";

export default function Bet() {
    const { activeAccount, wssocket, ws_socket_errors } = useSession();
    const [isBetItemVisible, setIsBetItemVisible] = useState(true);
    const [isAutoBetVisible1, setIsAutoBetVisible1] = useState(false);
    const [isAutoCashoutInputEnabled, setIsAutoCashoutInputEnabled] = useState(false);
    const [isBetOneAuto, setIsBetOneAuto] = useState(false);
    const [inputValues, setInputValues] = useState({ input1: "10.00", input3: "1.10" });
    const [lastAddedValues, setLastAddedValues] = useState({ input1: 0, input2: 0 });
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
    const [multiplier, setMultiplier] = useState("1.00")
    const [isflyAway, setIsFlyAway] = useState<string>("false")

    const { addAlert } = useAlert();
    const { eventTriggered } = useUserInteraction()

    const {
        account,
        betOnePlaced,
        betOneStatus,
        stakeForbetOne,
        AutoTradeBetOne,
        CashOutBetOne,
        setStakeForbetOne,
        setTakeProfitForBetOne,
        setCashOutBetOne,
        setAutoTradeBetOne,
        setbetOnePlaced,
        setbetOneStatus,
        setWonAmount,
        setRoundStarted,
        WonAmount,
        LastSettledTradeId,
        setRoundID,
        CashoutX,
        ErrorMessage,
    } = useTrading()
    
    const isBetOneAutoRef = useRef(isBetOneAuto)
    const previousFlyAwayRef = useRef(isflyAway)
    const lastWinAlertRef = useRef("")
    const accountBalance = Number(account?.balance)
    const hasSyncedBalance = Number.isFinite(accountBalance)
    const currency = account?.currency || activeAccount?.currency || ""

    useEffect(() => {
        if (!wssocket?.on || !wssocket?.off) return;

        const handleRoundId = (data: any) => {
            if (!data || (Array.isArray(data) && data.length === 0)) return;

            if (data.round_id !== undefined && data.round_id !== null) {
                setRoundID(data.round_id);
            }

        }
        const handleMultiplier = (data: any) => {
            if (!data || (Array.isArray(data) && data.length === 0)) return;
            setMultiplier(data.multiplier)
        };

        const handleCrashed = (data: any) => {
            if (!data || (Array.isArray(data) && data.length === 0)) return;
            setIsFlyAway(data.crashed)
        };

        wssocket.on("round_id", handleRoundId);
        wssocket.on("multiplier", handleMultiplier);
        wssocket.on("crashed", handleCrashed);

        return () => {
            wssocket.off("round_id", handleRoundId)
            wssocket.off("multiplier", handleMultiplier);
            wssocket.off("crashed", handleCrashed);
        };
    }, [wssocket]);

    useEffect(() => {
        isBetOneAutoRef.current = isBetOneAuto;
    }, [isBetOneAuto])

    useEffect(() => {
        function handleWS_SocketErrors() {
            if (ws_socket_errors) {
                addAlert(ws_socket_errors, 3000, "red", 1, false);
            }
            return;
        }
        handleWS_SocketErrors();
    }, [addAlert, ws_socket_errors])

    useEffect(() => {
        function handleErrors() {
            if (ErrorMessage) {
                addAlert(ErrorMessage, 3000, "red", 1, false);
            }
            return;
        }
        handleErrors();
    }, [ErrorMessage, addAlert])

    useEffect(() => {
        if (AutoTradeBetOne && !betOnePlaced) {
            PlaceBet(1);
            setIsBetOneAuto(true)
        } else if (!AutoTradeBetOne && betOnePlaced && isBetOneAutoRef.current) {
            PlaceBet(1)
            setIsBetOneAuto(false)
        }
    }, [AutoTradeBetOne, betOnePlaced]);

    useEffect(() => {
        const previousFlyAway = previousFlyAwayRef.current;
        previousFlyAwayRef.current = isflyAway;

        const handleBetButtonsFromSocketInfo = () => {
            if (previousFlyAway === "false" && betOneStatus === "active" && betOnePlaced && isflyAway === "true") {
                setCashOutBetOne(false)
                setbetOnePlaced(false)
                setbetOneStatus('')
            }
        }
        handleBetButtonsFromSocketInfo()
    }, [betOnePlaced, betOneStatus, isflyAway, setCashOutBetOne, setbetOnePlaced, setbetOneStatus])

    useEffect(() => {
        const handleWin = () => {
            if (WonAmount > 0) {
                const alertKey = LastSettledTradeId || `${WonAmount}:${CashoutX}:${account?.currency}`;

                if (lastWinAlertRef.current === alertKey) {
                    setWonAmount(0);
                    return;
                }

                lastWinAlertRef.current = alertKey;
                const won = {
                    amount: WonAmount,
                    cashout: CashoutX,
                    currency: account?.currency
                };
                addAlert(won, 5000, "green", 2, true);
                if (eventTriggered) {
                    const audio = new Audio('/assets/audio/aviatorwin.mp3');
                    audio.play().catch((err) => console.error("Audio playback failed:", err));
                }
                setWonAmount(0);
            }
        }
        handleWin();
    }, [WonAmount, LastSettledTradeId, CashoutX, account?.currency, addAlert, eventTriggered, setWonAmount]);

    useEffect(() => {
        const SendBetData = () => {
            if (isflyAway !== "true") return;

            if (betOnePlaced && betOneStatus === "pending") {
                const stake = Number(stakeForbetOne);

                if (!hasSyncedBalance) {
                    addAlert("Account is still syncing. Please try again.", 3000, "red", 1, true);
                    setbetOnePlaced(false);
                    setAutoTradeBetOne(false);
                    setbetOneStatus("")
                    return;
                }

                if (stake > accountBalance) {
                    addAlert("Not enough balance", 3000, "red", 1, true);
                    setbetOnePlaced(false);
                    setAutoTradeBetOne(false);
                    setbetOneStatus("")
                    return;
                }
                setbetOneStatus("active")
            }
        };
        const handleStartNextRoundBets = () => {
            if (isflyAway === "false" && betOnePlaced && betOneStatus === "active") {
                setRoundStarted(true);
            } else {
                setRoundStarted(false)
            }
        }

        SendBetData();
        handleStartNextRoundBets()
    }, [
        isflyAway,
        betOnePlaced,
        betOneStatus,
        stakeForbetOne,
        hasSyncedBalance,
        accountBalance,
        addAlert,
        setAutoTradeBetOne,
        setRoundStarted,
        setbetOnePlaced,
        setbetOneStatus,
    ]);

    useEffect(() => {
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [intervalId]);

    const parseInputNumber = (value: string, fallback = 0) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };

    const formatMoney = (value: string | number) => parseInputNumber(String(value)).toFixed(2);

    const sanitizeDecimalInput = (value: string) => {
        const sanitized = value.replace(/[^0-9.]/g, '');
        const [whole, ...decimalParts] = sanitized.split('.');
        const decimal = decimalParts.join('');

        if (decimalParts.length === 0) {
            return whole;
        }

        return `${whole}.${decimal.slice(0, 2)}`;
    };

    const blockInvalidNumberInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key.length === 1 && !/[0-9.]/.test(e.key)) {
            e.preventDefault();
        }
    };

    const handleDataValueClick = (input: 'input1', value: number) => {
        setInputValues(prev => ({
            ...prev,
            [input]: formatMoney(parseInputNumber(prev[input]) + value)
        }));
        setLastAddedValues(prev => ({
            ...prev,
            [input]: value
        }));
    };

    const handleRepeatedDataValueClick = (input: 'input1') => {
        setInputValues(prev => ({
            ...prev,
            [input]: formatMoney(parseInputNumber(prev[input]) + lastAddedValues[input])
        }));
    };

    const startAdjustingValue = (input: 'input1', change: number) => {
        setInputValues(prev => ({
            ...prev,
            [input]: formatMoney(Math.max(0, parseInputNumber(prev[input]) + change))
        }));
        const id = setInterval(() => {
            setInputValues(prev => ({
                ...prev,
                [input]: formatMoney(Math.max(0, parseInputNumber(prev[input]) + change))
            }));
        }, 100);
        setIntervalId(id);
    };

    const stopAdjustingValue = () => {
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
    };

    const handleAutoBetToggle = (input: 'bet' | 'auto') => {
        if (input === 'bet') {
            setIsAutoBetVisible1(false);
        } else if (input === 'auto') {
            setIsAutoBetVisible1(true);
        }
    };

    const handleInputChange = (e: any) => {
        let { value, id } = e.target;
        setInputValues((prevValues) => ({
            ...prevValues,
            [id]: sanitizeDecimalInput(value),
        }));
    };

    const handleCashOutInputChange = (e: React.ChangeEvent<HTMLInputElement>, inputKey: 'input3') => {
        setInputValues((prevValues) => ({
            ...prevValues,
            [inputKey]: sanitizeDecimalInput(e.target.value),
        }));
    };

    const handleInputBlur = (inputKey: 'input1' | 'input3', fallback: number) => {
        setInputValues((prevValues) => ({
            ...prevValues,
            [inputKey]: formatMoney(prevValues[inputKey] === "" || prevValues[inputKey] === "." ? fallback : prevValues[inputKey]),
        }));
    };

    const PlaceBet = (bet: 1 | 2) => {
        const defaultStake = 10.00;
        const defaultMultiplier = 1.10;
        const minimumMultiplier = 1.01;
        const minimumBet = 1.00;
        const maximumBet = 1000.0;

        if (bet !== 1) return;

        const isInvalidValue = (value: number, min: number, max: number) => isNaN(value) || value < min || value > max;

        const calculateProfit = (stake: number, takeProfit: number) =>
            parseFloat(((takeProfit * stake) - stake).toFixed(2));

        if (betOnePlaced) {
            const stake = parseInputNumber(inputValues.input1);
            const takeProfit = parseInputNumber(inputValues.input3);

            const profit = calculateProfit(stake, takeProfit);

            setStakeForbetOne(stake);

            if (isAutoCashoutInputEnabled) {
                setTakeProfitForBetOne(profit);
            } else {
                setTakeProfitForBetOne(0);
            }

            setbetOnePlaced(false);
            setbetOneStatus("");
        } else {
            let stake = parseInputNumber(inputValues.input1);
            let takeProfit = parseInputNumber(inputValues.input3);

            if (isInvalidValue(stake, minimumBet, maximumBet)) {
                stake = defaultStake;
            }
            if (isInvalidValue(takeProfit, minimumMultiplier, Infinity)) {
                takeProfit = defaultMultiplier;
            }

            if (!hasSyncedBalance) {
                addAlert("Account is still syncing. Please try again.", 3000, "red", 1, true);
                setAutoTradeBetOne(false);
                return;
            }

            if (stake > accountBalance) {
                addAlert("Not enough balance", 3000, "red", 1, true);
                setAutoTradeBetOne(false);
                return;
            }

            const profit = calculateProfit(stake, takeProfit);

            setStakeForbetOne(stake);

            if (isAutoCashoutInputEnabled) {
                setTakeProfitForBetOne(profit);
            } else {
                setTakeProfitForBetOne(0);
            }

            setbetOnePlaced(true);
            setbetOneStatus("pending");
        }
    };

    const getBetOneClass = () => {
        if (betOnePlaced && !CashOutBetOne && isflyAway === "false" && betOneStatus === "active") {
            return "cashoutActive";
        }
        if (betOnePlaced && betOneStatus === "pending") {
            return "betActive";
        }
        if (betOnePlaced && betOneStatus === "active" && isflyAway === "true") {
            return "betActive";
        }
        return "";
    };

    const handleCashoutBet = () => {
        setCashOutBetOne(true)
        setbetOnePlaced(false)
        setbetOneStatus("")
    }

    const isAutoCashoutLocked = !isAutoCashoutInputEnabled || AutoTradeBetOne || (betOnePlaced && betOneStatus === "active" && isflyAway === "false");

    return (
        <div className="aviator-btns-container">

            <div
                id="aviator-btn-container-1"
                className={`aviator-btn-container-1 ${getBetOneClass()}`}
            >

                <div className="aviator-btn-top-container">
                    <div className="aviator-btn-top-container-btns">
                        <div
                            onClick={() => handleAutoBetToggle('bet')}
                            id="aviator-manual-bet-btn"
                            className={`aviator-bet-btn ${!isAutoBetVisible1 ? 'active' : ''}`}
                        >
                            Bet
                        </div>
                        <div
                            onClick={() => handleAutoBetToggle('auto')}
                            id="aviator-auto-bet-btn"
                            className={`aviator-bet-btn ${isAutoBetVisible1 ? 'active' : ''}`}
                        >
                            Auto
                        </div>
                    </div>

                    {!isBetItemVisible && (
                        <div onClick={() => { setIsBetItemVisible(true) }} className="aviator-btn-top-right-container-btns">
                            <div id="aviator-show-betobject" className="aviator-btn-top-container-option-add">+</div>
                        </div>
                    )}

                </div>
                <div className="aviator-btn-bottom-container">
                    <div className="aviator-btn-bottom-container-left">
                        <div className="aviator-bet-container">
                            <div
                                className="minus-btn"
                                id="minus-input1"
                                onMouseDown={() => startAdjustingValue('input1', -1)}
                                onMouseUp={stopAdjustingValue}
                                onMouseLeave={stopAdjustingValue}
                            >-</div>
                            <input
                                type="text"
                                inputMode="decimal"
                                pattern="[0-9]*[.]?[0-9]*"
                                className="aviator-bet-input"
                                id="input1"
                                onKeyDown={blockInvalidNumberInput}
                                onChange={handleInputChange}
                                onBlur={() => handleInputBlur('input1', 10)}
                                placeholder="0.00"
                                value={inputValues.input1}
                            />
                            <div
                                className="plus-btn"
                                id="plus-input1"
                                onMouseDown={() => startAdjustingValue('input1', 1)}
                                onMouseUp={stopAdjustingValue}
                                onMouseLeave={stopAdjustingValue}
                            >+</div>
                        </div>

                        <div className="aviator-input-btn-container">
                            {[1, 5].map((value) => (
                                <div
                                    key={value}
                                    className="aviator-input-btn"
                                    onClick={() => {
                                        if (lastAddedValues.input1 === value) {
                                            handleRepeatedDataValueClick('input1');
                                        } else {
                                            handleDataValueClick('input1', value);
                                        }
                                    }}
                                >
                                    {value.toFixed(2)}
                                </div>
                            ))}
                        </div>
                        <div className="aviator-input-btn-container">
                            {[20, 100].map((value) => (
                                <div
                                    key={value}
                                    className="aviator-input-btn"
                                    onClick={() => {
                                        if (lastAddedValues.input1 === value) {
                                            handleRepeatedDataValueClick('input1');
                                        } else {
                                            handleDataValueClick('input1', value);
                                        }
                                    }}
                                >
                                    {value.toFixed(2)}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="aviator-btn-bottom-container-right ">
                        {isflyAway === "false" && betOneStatus === "pending" && betOnePlaced && (<span className="next-round-text display-center">Waiting for next round</span>)}
                        <button onClick={() => {
                            if (betOnePlaced && betOneStatus === "active" && !CashOutBetOne) {
                                handleCashoutBet()
                            } else {
                                PlaceBet(1)
                            }
                        }

                        }
                            disabled={!hasSyncedBalance && !betOnePlaced}
                            className={`aviator-betting-btn ${isflyAway === "false" && betOnePlaced && betOneStatus === "pending" ? "active" : "none"}`} id="button1">

                            {betOnePlaced && betOneStatus === "pending" && (
                                <>
                                    <span className="aviator-bet-btn-text">CANCEL</span>
                                </>
                            )}
                            {betOnePlaced && betOneStatus === "active" && isflyAway === "true" && (
                                <>
                                    <span className="aviator-bet-btn-text">CANCEL</span>
                                </>
                            )}
                            {betOnePlaced && !CashOutBetOne && betOneStatus === "active" && isflyAway === "false" && (
                                <>
                                    <span className="aviator-bet-btn-text">CASH OUT</span>
                                    <span id="aviator-bet-btn-amount2" className="aviator-bet-btn-amount">{(Number(stakeForbetOne) * Number(multiplier)).toFixed(2)} {currency}</span>
                                </>
                            )}
                            {!betOnePlaced && (
                                <>
                                    <span className="aviator-bet-btn-text">BET</span>
                                    <span id="aviator-bet-btn-amount" className="aviator-bet-btn-amount">{formatMoney(inputValues.input1)} {currency}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>


                {isAutoBetVisible1 && (
                    <>
                        <div id="separator1" className="aviator-autobet-separator"></div>

                        <div id="aviator-autobet-section1" className="aviator-auto-bet-container">
                            <div className="aviator-autobet-btns">
                                <div className="aviator-autobet-title">Auto Bet</div>
                                <div className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        id="toggle4"
                                        checked={AutoTradeBetOne}
                                        onChange={() => {
                                            setAutoTradeBetOne((prev: any) => !prev);
                                        }}

                                    />
                                    <label htmlFor="toggle4" className="slider"></label>
                                </div>
                            </div>

                            <div className="aviator-autocashout-btns">
                                <div className="aviator-autocashout-title">Auto Cash Out</div>
                                <div className="toggle-switch">
                                    <input
                                        checked={isAutoCashoutInputEnabled}
                                        type="checkbox"
                                        id="toggle5"
                                        onChange={() => setIsAutoCashoutInputEnabled(prev => !prev)}
                                    />
                                    <label htmlFor="toggle5" className="slider"></label>
                                </div>
                                <div className="aviator-auto-multiplier-input">
                                    <input
                                        disabled={isAutoCashoutLocked}
                                        type="text"
                                        inputMode="decimal"
                                        pattern="[0-9]*[.]?[0-9]*"
                                        id="aviator-auto-multiplier1"
                                        className="aviator-auto-multiplier"
                                        onKeyDown={blockInvalidNumberInput}
                                        onChange={(e) => handleCashOutInputChange(e, 'input3')}
                                        onBlur={() => handleInputBlur('input3', 1.10)}
                                        placeholder="1.10"
                                        value={inputValues.input3}
                                    />
                                    <button
                                        disabled={isAutoCashoutLocked}
                                        id="clear-input-btn1"
                                        className="aviator-auto-multiplier-clearinput"
                                        onClick={() => setInputValues((prevValues) => ({ ...prevValues, input3: "" }))}
                                    >
                                        &times;
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
