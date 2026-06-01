import Emoji from "../PopUps/Emojis";
import { useEffect, useRef, useState } from "react";
import Gif from "../PopUps/Gif";
import { useAlert } from "@/context/AlertContext";

const CHAT_MESSAGE_LIMIT = 100;
const DEFAULT_AVATAR = "assets/images/avatar.png";

const normalizeChatMessage = (msg: any) => {
  const messageType =
    msg.type ||
    (Array.isArray(msg.betData) && msg.betData.length > 0
      ? "win_display"
      : Array.isArray(msg.bet) && msg.bet.length > 0
        ? "win_display"
        : msg.gifUrl
          ? "gif"
          : "text");

  return {
    type: messageType,
    content: msg.message ?? msg.content ?? null,
    userId: msg.userId,
    url: msg.url || DEFAULT_AVATAR,
    gifUrl: msg.gifUrl || null,
    messageId: msg.messageId || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    userHasLiked: !!msg.userHasLiked,
    likeCount: msg.likeCount || 0,
    bet: messageType === "win_display" ? msg.betData || msg.bet || [] : [],
  };
};

const mergeChatMessages = (existingMessages: any[], incomingMessages: any[]) => {
  const messagesById = new Map(existingMessages.map((msg) => [msg.messageId, msg]));

  incomingMessages
    .filter((msg) => msg.userId)
    .map(normalizeChatMessage)
    .forEach((msg) => {
      messagesById.set(msg.messageId, {
        ...messagesById.get(msg.messageId),
        ...msg,
      });
    });

  return Array.from(messagesById.values()).slice(-CHAT_MESSAGE_LIMIT);
};

export default function Chat({ onToggleChat, activeAccount, username, socket, AllbetsData, Multipliers }: any) {
  const [isEmojiVisible, setIsEmojiVisible] = useState(false);
  const [isGifVisible, setIsGifVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [chatCount, setchatCount] = useState(0);
  const [newMessages, setNewMessages] = useState(0);
  const chatContainerRef = useRef<any>(null);
  const isAtBottomRef = useRef(true);

  const { addAlert } = useAlert();

  useEffect(() => {
    if (!socket?.emit || !socket?.on || !activeAccount?.derivId) return;

    const appId = activeAccount.derivId;

    const handleChatHistory = (data: any) => {
      const history = Array.isArray(data) ? data : [data];
      setMessages(mergeChatMessages([], history));
      setNewMessages(0);
      isAtBottomRef.current = true;
    };

    const handleReceiveMessage = (data: any) => {
      const messagesToAdd = Array.isArray(data) ? data : [data];
      setMessages((prevMessages) => mergeChatMessages(prevMessages, messagesToAdd));
    };

    const handleChatCount = (data: any) => {
      setchatCount(Number(data) || 0);
    };

    const handleSocketError = (data: any) => {
      console.log(`Error ${data}`);
    };

    socket.emit("join_chat", appId);
    socket.on("chat_history", handleChatHistory);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("chat_count", handleChatCount);
    socket.on("error", handleSocketError);

    return () => {
      socket.emit("leave_chat", appId);
      socket.off("chat_history", handleChatHistory);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("chat_count", handleChatCount);
      socket.off("error", handleSocketError);
    };
  }, [activeAccount?.derivId, socket]);

  useEffect(() => {
    if (!socket?.on || !socket?.off) return;

    const handleUpdateLikeCount = (data: any) => {
      const { messageId, likeCount, userHasLiked } = data;

      // Update the state with the new like count and user like status
      setMessages((prevMessages: any) =>
        prevMessages.map((msg: any) =>
          msg.messageId === messageId
            ? {
              ...msg,
              likeCount, // Update likeCount
              ...(typeof userHasLiked === "boolean" ? { userHasLiked } : {}),
            }
            : msg
        )
      );
    };

    socket.on('update_like_count', handleUpdateLikeCount);

    return () => {
      socket.off('update_like_count', handleUpdateLikeCount);
    };
  }, [socket]);

  const handleLikeClick = (messageId: string) => {
    if (activeAccount?.derivId || activeAccount?.code) {
      const appId = activeAccount.derivId;
      const userId = activeAccount.code;

      // Optimistically update the UI
      setMessages((prevMessages: any) =>
        prevMessages.map((msg: any) =>
          msg.messageId === messageId
            ? {
              ...msg,
              likeCount: msg.userHasLiked
                ? Math.max(0, msg.likeCount - 1) // Decrease likeCount if already liked
                : msg.likeCount + 1,           // Increase likeCount if not liked
              userHasLiked: !msg.userHasLiked,  // Toggle userHasLiked status
            }
            : msg
        )
      );

      // Emit the event to toggle like/unlike on the server
      socket.emit('toggle_like_message', {
        appId,
        messageId,
        userId,
      });
    }
  };

  const handleToggleEmoji = () => {
    setIsEmojiVisible((prevState) => !prevState);
    if (isGifVisible) {
      setIsGifVisible(false);
    }
  };

  const handleToggleGif = () => {
    setIsGifVisible((prevState) => !prevState);
    if (isEmojiVisible) {
      setIsEmojiVisible(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prevMessage) => prevMessage + emoji);
  };

  function generateRandomMessageId() {
    return Math.random().toString(36).substring(2, 14);
  }

  const handleGifSelect = (gifUrl: string) => {
    if (activeAccount?.derivId && socket?.emit) {
      const appId = activeAccount.derivId;
      const messageId = generateRandomMessageId();
      let url = localStorage.getItem('userAvatar');
      if (!url) {
        url = DEFAULT_AVATAR;
      }

      // Emit the GIF message
      socket.emit("send_message", { appId, message: "", gifUrl: gifUrl, url: url, messageId: messageId });
      setIsGifVisible(false);
    }
  };

  const sendMessage = () => {
    if (message.trim() !== "" && message.length <= 250 && activeAccount?.derivId && socket?.emit) {
      const appId = activeAccount.derivId;
      const messageId = generateRandomMessageId(); // Generate random message ID
      let url = localStorage.getItem("userAvatar");
      if (!url) {
        url = DEFAULT_AVATAR;
      }

      // Extract bet ID from the message (if any)
      const betIdMatch = message.match(/share_bet:(\d+):/); // Match share_bet:<id>:
      console.log(`BetIDMatch: ${betIdMatch}, Bet Data: ${AllbetsData}`);

      let betData = [];
      let cleanedMessage = message;

      if (betIdMatch) {
        const betId = betIdMatch[1]; // Extracted bet ID from message
        // Find bet data using the extracted bet ID
        betData = (Array.isArray(AllbetsData) ? AllbetsData : []).filter((bet: any) => String(bet.id) === String(betId));
        console.log(`BetData: ${JSON.stringify(betData)}`);

        if (betData.length > 0) {
          const roundId = betData[0]?.round_id; // Extract `round_id` from the bet data
          const roundMultiplier = (Array.isArray(Multipliers) ? Multipliers : []).find((mul: any) => String(mul.id) === String(roundId))?.value;

          // Append `roundMultiplier` to the bet data
          if (roundMultiplier) {
            betData[0].roundMultiplier = roundMultiplier;
          }
        }

        // Clean the message by removing the share_bet:<id>: part
        cleanedMessage = message.replace(/share_bet:\d+:\s*/, ""); // Remove the share_bet:<id>: including optional spaces

        // If there's no other content in the message, set it to empty
        if (!cleanedMessage.trim()) {
          cleanedMessage = "";
        }

        console.log(`Cleaned message: ${cleanedMessage}`);
      }

      // Emit the message with updated data
      socket.emit("send_message", {
        appId,
        message: cleanedMessage,
        url,
        gifUrl: "", // Assuming no gif for this example
        messageId,
        betData: betData.length > 0 ? betData : [], // Only include bet data if it exists
        type: betData.length > 0 ? "win_display" : "text", // Set type to "win_display" if bet exists
      });

      setMessage(""); // Clear the input after sending
    } else if (message.length > 250) {
      addAlert(`Message exceeds 250 characters limit.`, 3000, "red", 1, true);
    }

    setIsEmojiVisible(false);
    setIsGifVisible(false);
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom(); // Scroll if at the bottom
    } else {
      setNewMessages((prev) => prev + 1); // Increment new messages counter
    }
  }, [messages]);

  // Handle the 'Scroll to Bottom' button click
  const handleScrollButtonClick = () => {
    scrollToBottom();
    setNewMessages(0); // Reset the counter once user scrolls manually
    isAtBottomRef.current = true; // Now user is at the bottom
  };

  // Detect if user has scrolled to the bottom of the chat container
  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (container) {
      const isAtBottom = container.scrollHeight - container.scrollTop === container.clientHeight;
      isAtBottomRef.current = isAtBottom;
    }
  };

  const getMultiplierClass = (multiplier: number) => {
    if (multiplier < 2) return "small";
    if (multiplier >= 2 && multiplier < 10) return "medium";
    return "large";
  };

  return (
    <section className="aviator-chat-section" id="aviator-chat-section">
      <div className="aviator-chat-section-header display-center">
        <div className="live-users">
          <i className="fa fa-circle" aria-hidden="true"></i>
        </div>
        {chatCount}
        <div onClick={onToggleChat} className="display-right" id="close-chatsection">
          <i className="fa fa-times" aria-hidden="true"></i>
        </div>
      </div>
      <div ref={chatContainerRef} onScroll={handleScroll} className="aviator-chat-section-body column">
        {messages.map((msg) => (
          <div key={msg.messageId} className={`aviator-chat-item ${msg.type === 'win_display' ? 'bet-display' : ''} column`}>
            <div className="aviator-chat-user row colg1">
              <img src={msg.url} alt="Avatar" />
              <div className="aviator-chat-username">
                {typeof msg.userId === "object" ? msg.userId.username : msg.userId}
              </div>
            </div>

            <div className="aviator-chat-message">
              {msg.type === "gif" ? (
                <img
                  src={msg.gifUrl || msg.content}
                  alt="GIF"
                  className="gif-chat-image"
                />
              ) : msg.type === "win_display" && msg.bet?.length > 0 ? (
                <>
                  <div className="column">
                    {msg.content !== '' && (
                      <div className="message-body">{msg.content}</div>
                    )}


                    <div className="aviator-chat-message-win-display display-center column">
                      <div className="aviator-chat-message-win-display-top">
                        <div className="aviator-chat-message-win-display-top-avatar">
                          <img
                            src={msg.bet[0].avatar || "assets/images/avatar.png"}

                            alt="Avatar"
                          />
                        </div>

                        <div className="aviator-chat-message-win-display-top-username">
                          {msg.bet[0].username || "Unknown"}
                        </div>
                      </div>
                      <div className="aviator-chat-message-win-display-bottom row">
                        <div className="aviator-chat-message-win-display-left">
                          <div className="aviator-chat-message-win-display-left-top column rowgp3">
                            <div className="aviator-chat-message-win-display-text">
                              Cashed out:
                            </div>
                            <div className={`aviator-chat-message-win-display-left-value ${getMultiplierClass(msg.bet[0].multiplier)}`}>
                              {msg.bet[0].multiplier || "N/A"}x
                            </div>
                          </div>
                          <div className="aviator-chat-message-win-display-left-bottom column rowgp3">
                            <div className="aviator-chat-message-win-display-text">
                              Round:
                            </div>
                            <div className={`aviator-chat-message-win-display-value`}>
                              {msg.bet[0].roundMultiplier || "N/A"}x
                            </div>
                          </div>
                        </div>
                        <div className="aviator-chat-message-win-display-right  column rowg1">
                          <div className="aviator-chat-message-win-display-right-top column rowgp3">
                            <div className="aviator-chat-message-win-display-text">
                              Win, {msg.bet[0].currency || "KES"}:
                            </div>
                            <div className="aviator-chat-message-win-display-value">
                              {msg.bet[0]?.profit
                                ? parseFloat(msg.bet[0].profit.toFixed(2)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                : "N/A"}

                            </div>
                          </div>
                          <div className="aviator-chat-message-win-display-right-bottom column rowgp3">
                            <div className="aviator-chat-message-win-display-text">
                              Bet, {msg.bet[0].currency || "KES"}:
                            </div>
                            <div className="aviator-chat-message-win-display-value">
                              {msg.bet[0]?.bet_amount
                                ? parseFloat(msg.bet[0].bet_amount.toFixed(2)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                : "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                msg.content
              )}
            </div>

            <div className="aviator-chat-btns display-center row colgp5">
              {msg.likeCount > 0 && <span>{msg.likeCount}</span>}
              <i
                onClick={() => handleLikeClick(msg.messageId)}
                className={`fa ${msg.userHasLiked ? 'fa-thumbs-up' : 'fa-thumbs-o-up'
                  }`}
                aria-hidden="true"
              ></i>
            </div>
          </div>
        ))}

      </div>

      {isEmojiVisible && (
        <Emoji onClose={() => setIsEmojiVisible(false)} onSelectEmoji={handleEmojiSelect} />
      )}
      {isGifVisible && (
        <Gif onClose={() => setIsGifVisible(false)} onSelectGif={handleGifSelect} />
      )}
      <div className="aviator-chat-section-footer">
        <div className="aviator-chat-section-footer-top">
          <input
            type="text"
            className="aviator-reply-input"
            placeholder="Reply"
            title="Start typing your reply..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <img
            src="assets/images/sendicon.png"
            alt="Send Message"
            title="Send Message"
            onClick={sendMessage}
            style={{ cursor: "pointer" }}
          />
        </div>
        <div className="aviator-chat-section-footer-bottom">
          <div className="aviator-chat-section-footer-bottom1">
            <i
              onClick={handleToggleEmoji}
              className="fa fa-smile-o"
              title="Select an emoji👆..."
              aria-hidden="true"
              style={{ fontSize: "16px", cursor: "pointer" }}
            ></i>
            <img
              onClick={handleToggleGif}
              src="assets/images/gificon.png"
              title="Select a GIF to add to chat👆..."
              alt="Gifs"
              style={{ fontSize: "16px", cursor: "pointer" }}
            />
          </div>
          <div className="aviator-chat-section-footer-bottom-text" title="Maximum of 250 characters allowed.">250</div>
        </div>
        {newMessages > 0 && !isAtBottomRef.current && (
          <button onClick={handleScrollButtonClick} className="scroll-to-bottom-btn display-center row colg1">
            New messages
            <i className="fa fa-arrow-down"
              aria-hidden="true"></i>
          </button>
        )}
      </div>
    </section>
  );
}
