"use client"
import { useEffect, useRef, useState } from "react"
import { EmitBetData } from "@/actions/socketHandler"

interface Trade {
  buy_price: number
  status: string
  profit: number
  contract_id: string
}

export const useMessages = ({
  messages,
  socket,
  wssocket,
  appId,
  username
}: {
  messages: any
  socket: WebSocket
  wssocket: any
  appId: any,
  username: any
}) => {
  const [account, setAccount] = useState<any>()
  const [RoundStarted, setRoundStarted] = useState(false)
  const [CashOutBetOne, setCashOutBetOne] = useState(false)
  const [betOnePlaced, setbetOnePlaced] = useState(false)
  const [betOneStatus, setbetOneStatus] = useState<string>('')
  const [AutoTradeBetOne, setAutoTradeBetOne] = useState(false)
  const [runningTrades, setRunningTrades] = useState<number>(0)
  const [stakeForbetOne, setStakeForbetOne] = useState<any>(10)
  const [WonAmount, setWonAmount] = useState<number>(0)
  const [ContractId, setContractId] = useState<number>()
  const [trades, setTrades] = useState<Trade[]>([])
  const [takeProfitForBetOne, setTakeProfitForBetOne] = useState<number>(1.10)
  const [strategy, setStrategy] = useState<string>("first")
  const [symbol, setSymbol] = useState<string>("R_10")
  const [resetDemoBal, setResetDemoBal] = useState<boolean>()
  const [RoundID, setRoundID] = useState<number>()
  const [CashoutX, setCashoutX] = useState<any>()
  const [ErrorMessage, setErrorMessage] = useState<string>("")
  const [previousStatus, setPreviousStatus] = useState(null);

  const RoundStartedRef = useRef(RoundStarted)
  const CashOutBetOneRef = useRef(CashOutBetOne)
  const betOnePlacedRef = useRef(betOnePlaced)
  const betOneStatusRef = useRef(betOneStatus)
  const AutoTradeBetOneRef = useRef(AutoTradeBetOne)
  const runningTradesRef = useRef(runningTrades)
  const stakeForbetOneRef = useRef(stakeForbetOne)
  const WonAmountRef = useRef(WonAmount)
  const ContractIdRef = useRef(ContractId)
  const tradesRef = useRef(trades)
  const takeProfitForBetOneRef = useRef(takeProfitForBetOne)
  const strategyRef = useRef(strategy)
  const symbolRef = useRef(symbol)
  const resetDemoBalRef = useRef(resetDemoBal)
  const RoundIDRef = useRef(RoundID)
  const CashoutXRef = useRef(CashoutX)
  const ErrorMessageRef = useRef(ErrorMessage)
  const previousStatusRef = useRef(previousStatus)

  useEffect(() => {
    RoundStartedRef.current = RoundStarted
    CashOutBetOneRef.current = CashOutBetOne;
    betOnePlacedRef.current = betOnePlaced;
    betOneStatusRef.current = betOneStatus;
    AutoTradeBetOneRef.current = AutoTradeBetOne;
    runningTradesRef.current = runningTrades;
    stakeForbetOneRef.current = stakeForbetOne;
    WonAmountRef.current = WonAmount;
    ContractIdRef.current = ContractId;
    tradesRef.current = trades;
    takeProfitForBetOneRef.current = takeProfitForBetOne;
    strategyRef.current = strategy;
    symbolRef.current = symbol;
    resetDemoBalRef.current = resetDemoBal;
    RoundIDRef.current = RoundID;
    CashoutXRef.current = CashoutX;
    ErrorMessageRef.current = ErrorMessage;
    previousStatusRef.current = previousStatus;
  }, [RoundStarted, CashOutBetOne, betOnePlaced, betOneStatus, AutoTradeBetOne, runningTrades, ErrorMessage, CashoutX,
    stakeForbetOne, WonAmount, ContractId, trades, takeProfitForBetOne, strategy, symbol, resetDemoBal, RoundID, previousStatus])

  useEffect(() => {

    function sendMsg(msg: any) {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(msg))
      }
    }

    function trimToTwoDecimals(number: any) {
      const roundedNum = parseFloat(number.toFixed(2))
      return roundedNum
    }

    function PlaceBet() {
      if (betOnePlacedRef.current && betOneStatusRef.current === "active" && runningTradesRef.current === 0) {
        if (RoundIDRef.current !== undefined && RoundIDRef.current !== null) {
          let url = localStorage.getItem("userAvatar");
          if (!url) {
            url = "assets/images/avatar.png";
          }
          const betdata = {
            status: "open",
            bet_amount: stakeForbetOneRef.current,
            multiplier: "",
            round_id: RoundIDRef.current,
            code: account.loginid,
            currency: account.currency,
            profit: 0,
            appId: appId,
            avatar: url,
            username: username.username,
          }

          EmitBetData(wssocket, betdata)
        }
      }
      // console.log("Am running...", stakeForbetOne, betOnePlaced, betOneStatus, runningTrades, currency, symbol, takeProfitForBetOne)
      if (betOnePlacedRef.current && RoundStartedRef.current && betOneStatusRef.current === "active" && runningTradesRef.current === 0) {
        console.log("Placing trade...")
        if (takeProfitForBetOneRef.current >= 0.05) {
          sendMsg({
            proposal: 1,
            amount: stakeForbetOneRef.current,
            contract_type: "ACCU",
            currency: account?.currency || "USD",
            basis: "stake",
            growth_rate: 0.05,
            limit_order: {
              take_profit: takeProfitForBetOneRef.current,
            },
            duration_unit: "s",
            product_type: "basic",
            symbol: symbolRef.current,
          })
        } else if (takeProfitForBetOneRef.current === 0) {
          sendMsg({
            proposal: 1,
            amount: stakeForbetOneRef.current,
            contract_type: "ACCU",
            currency: account?.currency || "USD",
            basis: "stake",
            growth_rate: 0.05,
            duration_unit: "s",
            product_type: "basic",
            symbol: symbolRef.current,
          })
        }

        setRunningTrades((prevData: number) => prevData + 1)
        return;
      }

    }

    function CashOut() {
      if (ContractId === 0) return;
      if (CashOutBetOne) {
        console.log("Cash out requested...", ContractId)
        sendMsg({
          sell: ContractId,
          price: 0
        })
        setCashOutBetOne(false)
      }
    }

    function TakeProfit() {
      sendMsg({
        proposal_open_contract: 1,
        contract_id: ContractId,
      });
    }

    function resetDemoBalance() {
      if (!resetDemoBal) return
      sendMsg({
        topup_virtual: 1,
      })
      setResetDemoBal(false)
    }

    function handleOngoingBets(proposal: any) {
      if (!proposal) return;
      const status = proposal.status;
      const contract_id = proposal.contract_id;
      const profit = proposal.profit;
      const won_amout = parseFloat(proposal.profit) + parseFloat(stakeForbetOneRef.current)
      const cashout = (won_amout / stakeForbetOne).toFixed(2)
      setCashoutX(cashout);
      let url = localStorage.getItem("userAvatar");
      if (!url) {
        url = "assets/images/avatar.png";
      }
      if (RoundIDRef.current !== undefined && RoundIDRef.current !== null) {
        const betdata = {
          status: status,
          bet_amount: stakeForbetOneRef.current,
          multiplier: cashout,
          round_id: RoundIDRef.current,
          code: account.loginid,
          currency: account.currency,
          profit: profit,
          appId: appId,
          avatar: url,
          username: username.username,
        }

        if (status === "open") {
          setCashOutBetOne(false);
          setbetOnePlaced(true);
          setContractId(contract_id);
          setbetOneStatus("active");
          setRunningTrades(1);
          setWonAmount(0);
          console.log("Status is open. Initializing bet...");
        } else if (status === "won") {
          if (previousStatusRef.current !== "won") {
            setRunningTrades(0);
            setbetOnePlaced(false);
            setbetOneStatus("");
            setContractId(0);
            setWonAmount(won_amout);
            EmitBetData(wssocket, betdata);
            setCashOutBetOne(true);
            console.log("Won amount:", proposal?.profit + stakeForbetOne);
          }
        } else if (status === "lost") {
          if (previousStatusRef.current !== "lost") {
            setRunningTrades(0);
            setbetOnePlaced(false);
            setbetOneStatus("");
            setContractId(0);
            setWonAmount(0);
            EmitBetData(wssocket, betdata);
            setCashOutBetOne(true);
          }
        }

        setPreviousStatus(status);
      }
    }

    function handleFailedBets(proposal: any) {
      if (proposal === undefined || (typeof proposal === "object" && Object.keys(proposal).length === 0 && betOnePlaced)) {
        setbetOnePlaced(false)
      }
      if (proposal === undefined || (typeof proposal === "object" && Object.keys(proposal).length === 0 && betOneStatus === "active")) {
        setbetOneStatus("")
      }
    }

    switch (messages?.msg_type) {
      case "authorize":
        const authData = messages?.authorize
        setAccount((prevData: any) => {
          const { balance, currency, loginid, is_virtual, account_list } =
            messages?.authorize

          prevData = { balance, currency, loginid, is_virtual, account_list }
          return prevData
        })
        sendMsg({
          ticks: symbol,
          subscribe: 1,
        })
        sendMsg({
          balance: 1,
          subscribe: 1,
        })
        sendMsg({
          portfolio: 1,
          subscribe: 1,
        })
        break
      case "proposal":
        const resp = messages?.proposal
        console.log("Proposal received:", resp);
        if (resp) {
          const proposalId = resp.id;
          sendMsg({
            buy: proposalId,
            price: resp.ask_price,
          })
        } else {
          setErrorMessage("Stage timed out")
          setbetOnePlaced(false)
          setbetOneStatus("")
          setWonAmount(0)
          setRunningTrades(0)
          setContractId(0)
          let url = localStorage.getItem("userAvatar");
          if (!url) {
            url = "assets/images/avatar.png";
          }
          if (RoundIDRef.current !== undefined && RoundIDRef.current !== null) {
            const betdata = {
              status: "cancelled",
              bet_amount: stakeForbetOneRef.current,
              multiplier: "",
              round_id: RoundIDRef.current,
              code: account.loginid,
              currency: account.currency,
              profit: 0,
              appId: appId,
              avatar: url,
              username: username.username,
            }

            EmitBetData(wssocket, betdata)
          }
        }

        break
      case "buy":
        const buy_resp = messages?.buy
        console.log("Buy response received:", buy_resp);
        let url = localStorage.getItem("userAvatar");
        if (!url) {
          url = "assets/images/avatar.png";
        }
        if (buy_resp) {
          setAccount((prevData: any) => {
            prevData.balance = buy_resp?.balance_after
            return prevData
          })
          console.log("Trade successfully placed! Contract ID:", buy_resp.contract_id);
          const contractId = buy_resp.contract_id;
          setContractId(contractId)
        } else {
          if (RoundIDRef.current !== undefined && RoundIDRef.current !== null) {
            const betdata = {
              status: "cancelled",
              bet_amount: stakeForbetOneRef.current,
              multiplier: "",
              round_id: RoundIDRef.current,
              code: account.loginid,
              currency: account.currency,
              profit: 0,
              appId: appId,
              avatar: url,
              username: username.username,
            }

            EmitBetData(wssocket, betdata)
          }
          setErrorMessage("Stage timed out")
          setbetOnePlaced(false)
          setbetOneStatus("")
          setWonAmount(0)
          setRunningTrades(0)
          setContractId(0)
        }

        break
      case "sell":
        const sell_resp = messages?.sell
        if (sell_resp) {
          setAccount((prevData: any) => {
            prevData.balance = sell_resp?.balance_after
            return prevData
          })
        } else {
          setErrorMessage("Stage timed out")
          setbetOnePlaced(false)
          setbetOneStatus("")
          setWonAmount(0)
          setRunningTrades(0)
          setContractId(0)
        }
        console.log("sell response received:", sell_resp);
        break
      case "error":
        const error = messages
        console.log("Error:", error)
        if (error) {
          setErrorMessage("Stage timed out")
          setbetOnePlaced(false)
          setbetOneStatus("")
          setWonAmount(0)
          setRunningTrades(0)
          setContractId(0)
        }

        break
      case "proposal_open_contract":
        const response = messages;
        if (response) {
          if (response.msg_type === "proposal_open_contract") {
            // console.log("Open Contract Details:", response.proposal_open_contract);
            const proposal = response.proposal_open_contract;
            if (proposal === undefined || (typeof proposal === "object" && Object.keys(proposal).length === 0)) {
              return;
            }
            handleOngoingBets(proposal)
            // handleFailedBets(proposal)
          }
        }

        break
      case "ping":
        break
      default:
        break
    }

    PlaceBet()
    CashOut()
    TakeProfit()
    resetDemoBalance()

  },
    [messages, strategy, symbol]
  )
  return {
    account,
    betOnePlaced: betOnePlacedRef.current,
    betOneStatus: betOneStatusRef.current,
    stakeForbetOne: stakeForbetOneRef.current,
    AutoTradeBetOne: AutoTradeBetOneRef.current,
    trades: tradesRef.current,
    CashOutBetOne: CashOutBetOneRef.current,
    WonAmount: WonAmountRef.current,
    RoundStarted: RoundStartedRef.current,
    RoundID: RoundIDRef.current,
    takeProfitForBetOne: takeProfitForBetOneRef.current,
    CashoutX: CashoutXRef.current,
    ErrorMessage: ErrorMessageRef.current,
    setStakeForbetOne,
    setRoundID,
    setRoundStarted,
    setWonAmount,
    setAutoTradeBetOne,
    setTakeProfitForBetOne,
    setRunningTrades,
    setCashOutBetOne,
    setbetOnePlaced,
    setbetOneStatus,
    setStrategy,
    setSymbol,
    setResetDemoBal,
  }
}
