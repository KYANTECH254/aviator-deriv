"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";

import { DeleteCookie, SetCookie } from "@/lib/Functions";
import { myPref } from "@/lib/Setting";
import useStoredAccounts from "@/hooks/useStoredAccounts";
import useAvatar from "@/hooks/useAvatars";
import useWebSocket from "@/hooks/useWebSocket";
import { useDerivWebsocket } from "@/hooks/useDerivWebSocket";
import { useDerivAccount } from "@/hooks/useDerivAccount";
import DerivAuthPopup from "@/components/PopUps/DerivAuthPopup";
import ErrorLoader from "@/components/ErrorLoader";

type SessionContextType = {
    account: any;
    loading: boolean;
    error: string | null;
    connected: boolean;
    username: string;
    avatar: string | null;
    activeAccount: any;
    multiplier: any;
    multipliers: any[];
    AllbetsData: any[];
    LiveBetsData: any;
    UpdatedBetData: any;
    maxMultiplier: any;
    crashed: string;
    socket: any;
    wssocket: any;
    handleAvatarUpdate: (avatar: string) => void;
    handleToggleChat: () => void;
    handleActiveAccount: (account: any) => void;
    isChatVisible: boolean;
    connectionComplete: boolean;
    cookieExists: number;
    messages: any;
    ws_socket_errors: string;
    appId: any;
};

const CODE_VERIFIER_KEY = "deriv_oauth_code_verifier";
const OAUTH_STATE_KEY = "deriv_oauth_state";
const REDIRECT_URI_KEY = "deriv_oauth_redirect_uri";

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error("useSession must be used within a SessionProvider");
    }
    return context;
};

const buildSessionAccount = (activeAccount: any, accounts: any[]) => ({
    balance: activeAccount?.balance ?? 0,
    currency: activeAccount?.currency,
    loginid: activeAccount?.loginid || activeAccount?.code || activeAccount?.accountId,
    is_virtual: activeAccount?.isVirtual ?? !activeAccount?.isLive,
    account_list: accounts,
});

const clearOAuthStorage = () => {
    sessionStorage.removeItem(CODE_VERIFIER_KEY);
    sessionStorage.removeItem(OAUTH_STATE_KEY);
    sessionStorage.removeItem(REDIRECT_URI_KEY);
};

const clearOAuthQueryParams = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    url.searchParams.delete("error");
    url.searchParams.delete("error_description");
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
};

export const SessionProvider = ({ children }: { children: ReactNode }) => {
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connectionComplete, setConnectionComplete] = useState(false);
    const [cookieExists, setCookieExists] = useState(1);

    const [isChatVisible, setIsChatVisible] = useState(false);
    const [username, setUsername] = useState('');
    const [multipliers, setMultipliers] = useState([]);
    const [multiplier, setMultiplier] = useState();
    const [AllbetsData, setAllbetsData] = useState([]);
    const [LiveBetsData, setLiveBetsData] = useState<any>(null);
    const [UpdatedBetData, setUpdatedBetData] = useState<any>(null);
    const [maxMultiplier, setMaxMultiplier] = useState(0);
    const [crashed, setCrashed] = useState("");
    const [account, setAccount] = useState<any>();

    const {
        activeAccount,
        toggleActiveAccount,
        setActiveAccount,
        setDerivAccounts,
    } = useStoredAccounts();
    const { avatar, updateAvatar } = useAvatar();
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(avatar);
    const [showDerivAuthPopup, setShowDerivAuthPopup] = useState(false);
    const [serverAuthError, setServerAuthError] = useState<string | null>(null);

    const derivAccountsFromUrl = useDerivAccount();

    const { wssocket }: any = useWebSocket({
        authToken: activeAccount?.authToken,
        onMessage: ({ eventName, data }) => {
            switch (eventName) {
                case "username":
                    setUsername(typeof data === "string" ? data : data?.username || "");
                    break;

                case "multiplier_data":
                    setMultipliers(Array.isArray(data) ? data : data?.multipliers || []);
                    break;

                case "bets_data":
                    setAllbetsData(Array.isArray(data) ? data : data?.bets || []);
                    break;

                case "live-bets":
                    setLiveBetsData(
                        Array.isArray(data)
                            ? {
                                round_id: null,
                                bets: data,
                                totalBetsCount: data.length,
                                previousRoundBets: [],
                                totalPreviousBetsCount: 0,
                            }
                            : data || null
                    );
                    break;

                case "bet-updated":
                    setUpdatedBetData(Array.isArray(data) ? data : data?.bets || data);
                    break;

                case "multiplier": {
                    const value = data?.multiplier ?? data;
                    setMultiplier(value);
                    break;
                }

                case "maxMultiplier": {
                    const value = data?.value ?? data?.maxMultiplier ?? data;
                    setMaxMultiplier(value);
                    break;
                }

                case "crashed": {
                    const value = data?.crashed ?? data;
                    setCrashed(value);
                    break;
                }
            }
        },
        onConnect: () => {
            setConnected(true);
            console.log("WebSocket connected");
        },
        onDisconnect: () => {
            setConnected(false);
            console.log("WebSocket disconnected");
        },
    });

    const { messages, socket, ws_socket_errors } = useDerivWebsocket({
        token: activeAccount?.token,
        deriv_id: activeAccount?.derivId,
        websocketUrl: activeAccount?.websocketUrl,
    });

    const persistDerivSession = (accounts: any[]) => {
        if (!accounts.length) {
            throw new Error("No Deriv accounts found");
        }

        const firstAccount = accounts[0];

        sessionStorage.setItem("accounts", JSON.stringify(accounts));
        sessionStorage.setItem("activeAccount", JSON.stringify(firstAccount));

        if (firstAccount.authToken || firstAccount.token) {
            SetCookie(firstAccount.authToken || firstAccount.token);
        }

        setDerivAccounts(accounts);
        setActiveAccount(firstAccount);
        setAccount(buildSessionAccount(firstAccount, accounts));
        setConnected(true);
        setConnectionComplete(true);
        setCookieExists(2);
        setError(null);
        setShowDerivAuthPopup(false);
        setServerAuthError(null);
    };

    const handleManualTokenLogin = async (manualToken: string) => {
        const derivId = derivAccountsFromUrl[0]?.derivId || String(myPref.appId);
        const code = derivAccountsFromUrl[0]?.code || `manual-${manualToken.slice(0, 8)}`;
        const currency = derivAccountsFromUrl[0]?.currency || "USD";

        const account = {
            code,
            token: manualToken,
            authToken: manualToken,
            derivId,
            currency,
            isLive: true,
            isVirtual: false,
        };

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
            const response = await fetch(`${apiUrl}/api/query-user`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    derivId,
                    token: manualToken,
                    currency,
                    raw: true,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success || !result.auth_token) {
                throw new Error(result.message || "Failed to register manual token");
            }

            persistDerivSession([{ ...account, authToken: result.auth_token }]);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Manual token login failed";
            console.error("Manual token login failed:", error);
            setError(message);
            setConnected(false);
            setConnectionComplete(false);
            setShowDerivAuthPopup(true);
        }
    };

    const safeJSONParse = (value: string | null, fallback: any) => {
        if (!value || value === 'undefined' || value === 'null') return fallback;
        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    };

    useEffect(() => {
        let cancelled = false;

        const loadStoredSession = () => {
            const storedAccounts = safeJSONParse(sessionStorage.getItem("accounts"), []);
            const storedActiveAccount = safeJSONParse(sessionStorage.getItem("activeAccount"), null);
            const accounts = Array.isArray(storedAccounts) ? storedAccounts : [];
            const accountToUse = storedActiveAccount || accounts[0];

            if (derivAccountsFromUrl.length) {
                persistDerivSession(derivAccountsFromUrl);
                return;
            }

            if (!accountToUse?.token) {
                DeleteCookie("token");
                setConnected(false);
                setConnectionComplete(false);
                setCookieExists(3);
                setError("Connect your Deriv account to play");
                setShowDerivAuthPopup(true);
                return;
            }

            const nextAccounts = accounts.length ? accounts : [accountToUse];
            persistDerivSession(nextAccounts);
        };

        const initializeDerivSession = async () => {
            setLoading(true);
            setError(null);

            try {
                const url = new URL(window.location.href);
                const oauthError = url.searchParams.get("error");
                const authorizationCode = url.searchParams.get("code");
                const returnedState = url.searchParams.get("state");

                if (oauthError) {
                    const description = url.searchParams.get("error_description") || oauthError;
                    clearOAuthStorage();
                    clearOAuthQueryParams();
                    throw new Error(description);
                }

                if (!authorizationCode) {
                    loadStoredSession();
                    return;
                }

                const savedState = sessionStorage.getItem(OAUTH_STATE_KEY);
                const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
                const redirectUri = sessionStorage.getItem(REDIRECT_URI_KEY);

                if (!savedState || returnedState !== savedState) {
                    throw new Error("OAuth state mismatch. Please reconnect your Deriv account.");
                }

                if (!codeVerifier || !redirectUri) {
                    throw new Error("OAuth session expired. Please reconnect your Deriv account.");
                }

                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                const response = await fetch(`${apiUrl}/api/oauth/exchange`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        code: authorizationCode,
                        codeVerifier,
                        redirectUri,
                    }),
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.message || "Deriv authentication failed");
                }

                clearOAuthStorage();
                clearOAuthQueryParams();
                persistDerivSession(result.accounts || []);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Connection failed";
                console.error("Deriv session connection failed:", error);
                clearOAuthStorage();
                setError(message);
                setConnected(false);
                setConnectionComplete(false);
                setCookieExists(3);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        initializeDerivSession();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        switch (messages?.msg_type) {
            case "authorize": {
                const auth = messages.authorize;
                if (!auth) break;

                const { balance, currency, loginid, is_virtual, account_list } = auth;
                setAccount({ balance, currency, loginid, is_virtual, account_list });

                if (loginid && activeAccount) {
                    const updatedActiveAccount = { ...activeAccount, loginid };
                    toggleActiveAccount(updatedActiveAccount);

                    setDerivAccounts((prevAccounts: any[]) =>
                        prevAccounts.map((accountItem: any) => {
                            const matchesActiveAccount =
                                accountItem.code === activeAccount.code ||
                                accountItem.loginid === activeAccount.loginid ||
                                accountItem.token === activeAccount.token ||
                                accountItem.authToken === activeAccount.authToken;

                            return matchesActiveAccount ? { ...accountItem, loginid } : accountItem;
                        })
                    );
                }
                break;
            }
            case "balance": {
                const balance = messages.balance;
                if (!balance) break;
                setAccount((prev: any) => ({
                    ...prev,
                    balance: balance.balance ?? prev?.balance,
                    currency: balance.currency ?? prev?.currency,
                    loginid: balance.loginid ?? prev?.loginid,
                }));
                break;
            }
            case "buy": {
                const buy = messages.buy;
                if (!buy?.balance_after) break;
                setAccount((prev: any) => ({ ...prev, balance: buy.balance_after }));
                break;
            }
            case "sell": {
                const sell = messages.sell;
                if (!sell?.balance_after) break;
                setAccount((prev: any) => ({ ...prev, balance: sell.balance_after }));
                break;
            }
        }
    }, [messages]);

    useEffect(() => {
        const exchangeServerAuthToken = async () => {
            if (messages?.msg_type !== "authorize") {
                return;
            }

            if (!activeAccount?.token || activeAccount?.authToken) {
                return;
            }

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                const response = await fetch(`${apiUrl}/api/query-user`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        code: activeAccount.code || activeAccount.loginid,
                        derivId: activeAccount.derivId,
                        token: activeAccount.token,
                        currency: activeAccount.currency,
                    }),
                });

                const result = await response.json();

                if (!response.ok || !result.success || !result.auth_token) {
                    throw new Error(result.message || "Failed to retrieve server auth token");
                }

                const updatedAccount = {
                    ...activeAccount,
                    authToken: result.auth_token,
                };

                setActiveAccount(updatedAccount);
                setDerivAccounts((prevAccounts: any[]) => {
                    const nextAccounts = prevAccounts.map((accountItem) =>
                        accountItem.code === updatedAccount.code || accountItem.loginid === updatedAccount.loginid
                            ? { ...accountItem, authToken: result.auth_token }
                            : accountItem
                    );
                    if (typeof window !== "undefined") {
                        sessionStorage.setItem("accounts", JSON.stringify(nextAccounts));
                        sessionStorage.setItem("activeAccount", JSON.stringify(updatedAccount));
                    }
                    return nextAccounts;
                });

                SetCookie(result.auth_token);
                setServerAuthError(null);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to synchronize login token";
                console.error("Server auth token exchange failed:", error);
                setServerAuthError(message);
                setError(message);
                setConnected(false);
                setConnectionComplete(false);
                setShowDerivAuthPopup(true);
            }
        };

        exchangeServerAuthToken();
    }, [messages, activeAccount]);

    const handleAvatarUpdate = (newAvatar: string) => {
        updateAvatar(newAvatar);
        setSelectedAvatar(newAvatar);
    };

    const handleToggleChat = () => setIsChatVisible(prev => !prev);

    const handleActiveAccount = (account: any) => {
        setActiveAccount(account);
        toggleActiveAccount(account);
        setAccount(buildSessionAccount(account, safeJSONParse(sessionStorage.getItem("accounts"), [])));

        if (account.authToken || account.token) {
            SetCookie(account.authToken || account.token);
            setShowDerivAuthPopup(false);
        }
    };

    useEffect(() => {
        setSelectedAvatar(avatar);
    }, [avatar]);

    if (showDerivAuthPopup) {
        return (
            <SessionContext.Provider
                value={{
                    account,
                    loading,
                    error,
                    connected,
                    username,
                    avatar: selectedAvatar,
                    activeAccount,
                    multiplier,
                    multipliers,
                    AllbetsData,
                    LiveBetsData,
                    UpdatedBetData,
                    maxMultiplier,
                    crashed,
                    socket,
                    wssocket,
                    handleAvatarUpdate,
                    handleToggleChat,
                    handleActiveAccount,
                    isChatVisible,
                    connectionComplete,
                    cookieExists,
                    messages,
                    ws_socket_errors,
                    appId: activeAccount?.derivId,
                }}
            >
                <DerivAuthPopup onClose={() => setShowDerivAuthPopup(false)} onManualToken={handleManualTokenLogin} />
            </SessionContext.Provider>
        );
    }

    if (cookieExists === 3) {
        return <ErrorLoader />;
    }

    return (
        <SessionContext.Provider
            value={{
                account,
                loading,
                error,
                connected,
                username,
                avatar: selectedAvatar,
                activeAccount,
                multiplier,
                multipliers,
                AllbetsData,
                LiveBetsData,
                UpdatedBetData,
                maxMultiplier,
                crashed,
                socket,
                wssocket,
                handleAvatarUpdate,
                handleToggleChat,
                handleActiveAccount,
                isChatVisible,
                connectionComplete,
                cookieExists,
                messages,
                ws_socket_errors,
                appId: activeAccount?.derivId,
            }}
        >
            {children}
        </SessionContext.Provider>
    );
};
