"use client"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react"
import { EmitBetData } from "@/actions/socketHandler"

interface Trade {
  buy_price: number
  status: string
  profit: number
  contract_id: string
}

interface TradingContextType {
  account: any
  betOnePlaced: boolean
  betOneStatus: string
  stakeForbetOne: any
  AutoTradeBetOne: boolean
  trades: Trade[]
  CashOutBetOne: boolean
  WonAmount: number
  RoundStarted: boolean
  RoundID: number | undefined
  takeProfitForBetOne: number
  CashoutX: any
  ErrorMessage: string
  setStakeForbetOne: (value: any) => void
  setRoundID: (value: number | undefined) => void
  setRoundStarted: (value: boolean) => void
  setWonAmount: (value: number) => void
  setAutoTradeBetOne: Dispatch<SetStateAction<boolean>>
  setTakeProfitForBetOne: (value: number) => void
  setRunningTrades: Dispatch<SetStateAction<number>>
  setCashOutBetOne: (value: boolean) => void
  setbetOnePlaced: (value: boolean) => void
  setbetOneStatus: (value: string) => void
  setStrategy: (value: string) => void
  setSymbol: (value: string) => void
  setResetDemoBal: (value: boolean) => void
}

const TradingContext = createContext<TradingContextType | undefined>(undefined)

interface TradingProviderProps {
  children: ReactNode
  messages: any
  socket: WebSocket
  wssocket: any
  appId: any
  username: any
  sessionAccount?: any
}

const toFiniteNumber = (value: any, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const trimToTwoDecimals = (value: number) => Number(value.toFixed(2))

export const TradingProvider = ({
  children,
  messages,
  socket,
  wssocket,
  appId,
  username,
  sessionAccount,
}: TradingProviderProps) => {
  const [account, setAccount] = useState<any>(sessionAccount)
  const [RoundStarted, setRoundStarted] = useState(false)
  const [CashOutBetOne, setCashOutBetOne] = useState(false)
  const [betOnePlaced, setbetOnePlaced] = useState(false)
  const [betOneStatus, setbetOneStatus] = useState<string>("")
  const [AutoTradeBetOne, setAutoTradeBetOne] = useState(false)
  const [runningTrades, setRunningTrades] = useState<number>(0)
  const [stakeForbetOne, setStakeForbetOne] = useState<any>(10)
  const [WonAmount, setWonAmount] = useState<number>(0)
  const [ContractId, setContractId] = useState<number>()
  const [trades] = useState<Trade[]>([])
  const [takeProfitForBetOne, setTakeProfitForBetOne] = useState<number>(1.1)
  const [strategy, setStrategy] = useState<string>("first")
  const [symbol, setSymbol] = useState<string>("R_100")
  const [resetDemoBal, setResetDemoBal] = useState<boolean>()
  const [RoundID, setRoundID] = useState<number>()
  const [CashoutX, setCashoutX] = useState<any>()
  const [ErrorMessage, setErrorMessage] = useState<string>("")
  const [previousStatus, setPreviousStatus] = useState<any>(null)

  const accountRef = useRef(account)
  const stakeForbetOneRef = useRef(stakeForbetOne)
  const RoundIDRef = useRef(RoundID)
  const previousStatusRef = useRef(previousStatus)
  const openBetAnnouncementKeyRef = useRef("")
  const proposalRequestKeyRef = useRef("")
  const cashoutRequestKeyRef = useRef("")
  const accountSubscriptionKeyRef = useRef("")

  useEffect(() => {
    accountRef.current = account
  }, [account])

  useEffect(() => {
    stakeForbetOneRef.current = stakeForbetOne
  }, [stakeForbetOne])

  useEffect(() => {
    RoundIDRef.current = RoundID
  }, [RoundID])

  useEffect(() => {
    previousStatusRef.current = previousStatus
  }, [previousStatus])

  useEffect(() => {
    if (!sessionAccount) return

    setAccount((prev: any) => ({
      ...prev,
      ...sessionAccount,
    }))
  }, [sessionAccount])

  const sendMsg = useCallback(
    (msg: any) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(msg))
        return true
      }
      return false
    },
    [socket]
  )

  const emitBetData = useCallback(
    (data: any) => {
      if (wssocket?.emit) {
        EmitBetData(wssocket, data)
      }
    },
    [wssocket]
  )

  const createBetData = useCallback(
    (status: string, multiplier: string | number = "", profit = 0) => {
      const currentAccount = accountRef.current
      const roundId = RoundIDRef.current

      if (!currentAccount || roundId === undefined || roundId === null) {
        return null
      }

      const avatar =
        typeof window !== "undefined"
          ? localStorage.getItem("userAvatar") || "assets/images/avatar.png"
          : "assets/images/avatar.png"
      const displayUsername = typeof username === "string" ? username : username?.username

      return {
        status,
        bet_amount: stakeForbetOneRef.current,
        multiplier,
        round_id: roundId,
        code: currentAccount.loginid,
        currency: currentAccount.currency,
        profit,
        appId,
        avatar,
        username: displayUsername,
      }
    },
    [appId, username]
  )

  const failTrade = useCallback(
    (message = "Stage timed out", emitCancelled = true) => {
      setErrorMessage(message)
      setRunningTrades(0)
      setbetOnePlaced(false)
      setbetOneStatus("")
      setContractId(undefined)
      setWonAmount(0)
      setCashOutBetOne(false)
      setAutoTradeBetOne(false)
      proposalRequestKeyRef.current = ""
      cashoutRequestKeyRef.current = ""

      if (emitCancelled) {
        const cancelledBet = createBetData("cancelled", "", 0)
        if (cancelledBet) {
          emitBetData(cancelledBet)
        }
      }
    },
    [createBetData, emitBetData]
  )

  useEffect(() => {
    if (!account?.loginid) return

    const subscriptionKey = `${account.loginid}:${symbol}`
    if (accountSubscriptionKeyRef.current === subscriptionKey) return

    if (!sendMsg({ ticks: symbol, subscribe: 1 })) return

    sendMsg({ balance: 1, subscribe: 1 })
    sendMsg({ portfolio: 1, subscribe: 1 })
    accountSubscriptionKeyRef.current = subscriptionKey
  }, [account?.loginid, sendMsg, symbol])

  useEffect(() => {
    if (!betOnePlaced || betOneStatus !== "active" || runningTrades !== 0) return

    const currentAccount = accountRef.current
    if (!currentAccount || RoundID === undefined || RoundID === null) return

    const announcementKey = `${RoundID}:${currentAccount.loginid}:${stakeForbetOne}`
    if (openBetAnnouncementKeyRef.current === announcementKey) return

    const betdata = createBetData("open", "", 0)
    if (!betdata) return

    openBetAnnouncementKeyRef.current = announcementKey
    emitBetData(betdata)
  }, [RoundID, betOnePlaced, betOneStatus, createBetData, emitBetData, runningTrades, stakeForbetOne])

  useEffect(() => {
    if (!betOnePlaced || !RoundStarted || betOneStatus !== "active" || runningTrades !== 0) return

    const currentAccount = accountRef.current
    const stake = trimToTwoDecimals(toFiniteNumber(stakeForbetOne))
    const balance = toFiniteNumber(currentAccount?.balance, Number.NaN)

    if (!currentAccount || !Number.isFinite(balance)) {
      failTrade("Account is still syncing. Please try again.", false)
      return
    }

    if (RoundID === undefined || RoundID === null) {
      failTrade("Round is not ready. Please try again.", false)
      return
    }

    if (stake > balance) {
      failTrade("Not enough balance", false)
      return
    }

    const proposalKey = `${RoundID}:${stake}:${takeProfitForBetOne}:${symbol}`
    if (proposalRequestKeyRef.current === proposalKey) return

    const proposal: any = {
      proposal: 1,
      amount: stake,
      contract_type: "ACCU",
      currency: currentAccount.currency || "USD",
      basis: "stake",
      growth_rate: 0.05,
      duration_unit: "s",
      product_type: "basic",
      symbol,
    }

    if (takeProfitForBetOne >= 0.05) {
      proposal.limit_order = { take_profit: trimToTwoDecimals(takeProfitForBetOne) }
    }

    proposalRequestKeyRef.current = proposalKey

    if (sendMsg(proposal)) {
      setRunningTrades(1)
      return
    }

    proposalRequestKeyRef.current = ""
    failTrade("Trading connection is not ready. Please try again.", false)
  }, [
    RoundID,
    RoundStarted,
    betOnePlaced,
    betOneStatus,
    failTrade,
    runningTrades,
    sendMsg,
    stakeForbetOne,
    symbol,
    takeProfitForBetOne,
  ])

  useEffect(() => {
    if (!CashOutBetOne || !ContractId) return

    const cashoutKey = String(ContractId)
    if (cashoutRequestKeyRef.current === cashoutKey) return

    cashoutRequestKeyRef.current = cashoutKey

    if (sendMsg({ sell: ContractId, price: 0 })) {
      setCashOutBetOne(false)
      return
    }

    cashoutRequestKeyRef.current = ""
    setCashOutBetOne(false)
    setErrorMessage("Trading connection is not ready. Please try again.")
  }, [CashOutBetOne, ContractId, sendMsg])

  useEffect(() => {
    if (!resetDemoBal) return

    if (sendMsg({ topup_virtual: 1 })) {
      setResetDemoBal(false)
    }
  }, [resetDemoBal, sendMsg])

  const handleOngoingBets = useCallback(
    (proposal: any) => {
      if (!proposal || typeof proposal !== "object") return

      const status = proposal.status || (proposal.is_sold ? "sold" : "")
      const contractId = toFiniteNumber(proposal.contract_id, 0)
      const profit = trimToTwoDecimals(toFiniteNumber(proposal.profit))
      const stake = toFiniteNumber(stakeForbetOneRef.current)
      const wonAmount = trimToTwoDecimals(stake + profit)
      const cashout = stake > 0 ? (wonAmount / stake).toFixed(2) : "0.00"
      const isClosed =
        status === "won" ||
        status === "lost" ||
        status === "sold" ||
        proposal.is_sold ||
        proposal.is_expired

      setCashoutX(cashout)

      if (status === "open" && !isClosed) {
        setCashOutBetOne(false)
        setbetOnePlaced(true)
        setContractId(contractId || undefined)
        setbetOneStatus("active")
        setRunningTrades(1)
        setWonAmount(0)
        setPreviousStatus("open")
        return
      }

      if (!isClosed) return

      const finalStatus = status || "sold"
      if (previousStatusRef.current === finalStatus) return

      setRunningTrades(0)
      setbetOnePlaced(false)
      setbetOneStatus("")
      setContractId(undefined)
      setWonAmount(wonAmount > 0 ? wonAmount : 0)
      setCashOutBetOne(false)
      setPreviousStatus(finalStatus)
      proposalRequestKeyRef.current = ""
      cashoutRequestKeyRef.current = ""
      openBetAnnouncementKeyRef.current = ""

      const betdata = createBetData(finalStatus, cashout, profit)
      if (betdata) {
        emitBetData(betdata)
      }
    },
    [createBetData, emitBetData]
  )

  useEffect(() => {
    switch (messages?.msg_type) {
      case "authorize": {
        const auth = messages.authorize
        if (!auth) {
          console.warn('Received authorize message with no authorize payload', messages)
          break
        }
        const { balance, currency, loginid, is_virtual, account_list } = auth
        setAccount({ balance, currency, loginid, is_virtual, account_list })
        setErrorMessage("")
        break
      }
      case "balance": {
        const balance = messages.balance
        if (!balance) break
        setAccount((prev: any) => ({
          ...prev,
          balance: balance.balance ?? prev?.balance,
          currency: balance.currency ?? prev?.currency,
          loginid: balance.loginid ?? prev?.loginid,
        }))
        break
      }
      case "proposal": {
        const resp = messages.proposal
        if (resp?.id) {
          sendMsg({ buy: resp.id, price: resp.ask_price })
        } else {
          failTrade("Stage timed out")
        }
        break
      }
      case "buy": {
        const buy = messages.buy
        if (buy?.contract_id) {
          setAccount((prev: any) => ({ ...prev, balance: buy.balance_after ?? prev?.balance }))
          setContractId(buy.contract_id)
          setRunningTrades(1)
          setbetOneStatus("active")
          setWonAmount(0)
          sendMsg({ proposal_open_contract: 1, contract_id: buy.contract_id, subscribe: 1 })
        } else {
          failTrade("Stage timed out")
        }
        break
      }
      case "sell": {
        const sell = messages.sell
        if (sell?.balance_after) {
          setAccount((prev: any) => ({ ...prev, balance: sell.balance_after }))
        }

        if (sell?.sold_for !== undefined && sell?.sold_for !== null && previousStatusRef.current !== "sold") {
          const stake = toFiniteNumber(stakeForbetOneRef.current)
          const soldFor = trimToTwoDecimals(toFiniteNumber(sell.sold_for))
          const profit = trimToTwoDecimals(soldFor - stake)
          const cashout = stake > 0 ? (soldFor / stake).toFixed(2) : "0.00"

          setRunningTrades(0)
          setbetOnePlaced(false)
          setbetOneStatus("")
          setContractId(undefined)
          setWonAmount(soldFor > 0 ? soldFor : 0)
          setCashOutBetOne(false)
          setPreviousStatus("sold")
          proposalRequestKeyRef.current = ""
          cashoutRequestKeyRef.current = ""
          openBetAnnouncementKeyRef.current = ""

          const betdata = createBetData("sold", cashout, profit)
          if (betdata) {
            emitBetData(betdata)
          }
        }
        break
      }
      case "proposal_open_contract": {
        const proposal = messages.proposal_open_contract
        if (proposal && Object.keys(proposal).length > 0) {
          handleOngoingBets(proposal)
        }
        break
      }
      case "error": {
        failTrade(messages.error?.message || "Stage timed out")
        break
      }
    }
  }, [createBetData, emitBetData, failTrade, handleOngoingBets, messages, sendMsg])

  useEffect(() => {
    if (betOnePlaced && betOneStatus === "active") return

    proposalRequestKeyRef.current = ""
    openBetAnnouncementKeyRef.current = ""
  }, [betOnePlaced, betOneStatus])

  const value = {
    account,
    betOnePlaced,
    betOneStatus,
    stakeForbetOne,
    AutoTradeBetOne,
    trades,
    CashOutBetOne,
    WonAmount,
    RoundStarted,
    RoundID,
    takeProfitForBetOne,
    CashoutX,
    ErrorMessage,
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

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>
}

export const useTrading = () => {
  const context = useContext(TradingContext)
  if (!context) throw new Error("useTrading must be used within a TradingProvider")
  return context
}
