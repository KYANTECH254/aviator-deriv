"use client";

import { Suspense } from "react";
import ConnectionLoader from "@/components/ConnectionLoader";
import PoweredByLoader from "@/components/PoweredByLoader";
import Header from "@/components/Header";
import AllBets from "@/components/Sections/AllBets";
import Bet from "@/components/Sections/Bet";
import Chat from "@/components/Sections/Chat";
import RoundHistory from "@/components/Sections/RoundHistory";
import { AlertProvider } from "@/context/AlertContext";
import ErrorLoader from "@/components/ErrorLoader";
import { SessionProvider, useSession } from "@/context/SessionProvider";
import Main from "@/components/LightWeightGameCanvas/Main";
import { SettingsProvider } from "@/context/SettingsContext";
import { TradingProvider } from "@/context/TradingContext";

export default function Page() {
  return (
    <Suspense>
      <SessionProvider>
        <Home />
      </SessionProvider>
    </Suspense>
  );
}

function Home() {
  const {
    account,
    loading,
    error,
    connected,
    username,
    avatar,
    activeAccount,
    multipliers,
    AllbetsData,
    LiveBetsData,
    UpdatedBetData,
    wssocket,
    handleAvatarUpdate,
    handleToggleChat,
    handleActiveAccount,
    isChatVisible,
    connectionComplete,
    cookieExists,
    socket,
    appId,
    messages,
  } = useSession();

  if (loading) {
    return <PoweredByLoader />;
  }

  if (error) {
    return <ErrorLoader />;
  }

  if (!connected) {
    return <ConnectionLoader />;
  }

  if (cookieExists === 3) {
    return <ErrorLoader />;
  }

  if (!connectionComplete) {
    return <ConnectionLoader />;
  }

  return (
    <AlertProvider>
      <SettingsProvider>
        <TradingProvider
          messages={messages}
          socket={socket}
          wssocket={wssocket}
          appId={appId}
          username={username}
          sessionAccount={account}
        >
          <div id="main-content" className="aviator-container">
            <div className={`aviator-header ${isChatVisible ? "shrink" : ""}`}>
              <Header
                account={account}
                AllbetsData={AllbetsData}
                username={username}
                onToggleActiveAccount={handleActiveAccount}
                activeAccount={activeAccount}
                avatar={avatar}
                onAvatarUpdate={handleAvatarUpdate}
                onToggleChat={handleToggleChat}
                isChatVisible={isChatVisible}
              />
            </div>

            <main className={`aviator-objects ${isChatVisible ? "shrink" : ""}`}>
              <AllBets
                activeAccount={activeAccount}
                AllbetsData={AllbetsData}
                Multipliers={multipliers}
                socket={wssocket}
                LiveBetsData={LiveBetsData}
                UpdatedBetData={UpdatedBetData}
              />
              <section className="aviator-betting-section" id="aviator-betting-section">
                <RoundHistory multipliers={multipliers} />
                <Main />
                <Bet />
              </section>

              {isChatVisible && (
                <Chat
                  AllbetsData={AllbetsData}
                  onToggleChat={handleToggleChat}
                  activeAccount={activeAccount}
                  username={username}
                  socket={wssocket}
                  Multipliers={multipliers}
                />
              )}
            </main>
          </div>
        </TradingProvider>
      </SettingsProvider>
    </AlertProvider>
  );
}
