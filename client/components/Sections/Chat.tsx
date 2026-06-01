import Emoji from "../PopUps/Emojis";
import { useEffect, useRef, useState } from "react";
import Gif from "../PopUps/Gif";
import { useAlert } from "@/context/AlertContext";

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
    if (activeAccount?.derivId) {
      const appId = activeAccount.derivId;

      // Join the chat room
      socket.emit("join_chat", appId);
      console.log(`Joined chat room ${appId}`);

      // Listener for incoming messages
      const handleReceiveMessage = (data: any) => {
        console.log("Received data:", data);

        // Ensure data is normalized to an array
        const messagesToAdd = Array.isArray(data) ? data : [data];

        // Validate and filter messages
        const validMessages = messagesToAdd.filter((msg) => msg.userId && msg.url);

        if (validMessages.length > 0) {
          setMessages((prevMessages) => {
            // Avoid duplication by ensuring new messages aren't already in the state
            const newMessageIds = validMessages.map((msg) => msg.messageId);
            const existingMessageIds = prevMessages.map((msg) => msg.messageId);

            const nonDuplicateMessages = validMessages.filter(
              (msg) => !existingMessageIds.includes(msg.messageId)
            );

            return [
              ...prevMessages,
              ...nonDuplicateMessages.map((msg) => {
                const messageType =
                  msg.betData && msg.betData.length > 0
                    ? "win_display"
                    : msg.gifUrl
                      ? "gif"
                      : "text";

                return {
                  type: messageType,
                  content: msg.message || null,
                  userId: msg.userId,
                  url: msg.url,
                  gifUrl: msg.gifUrl || null,
                  messageId: msg.messageId,
                  userHasLiked: !!msg.userHasLiked,
                  likeCount: msg.likeCount || 0,
                  bet: messageType === "win_display" ? msg.betData || [] : [],
                };
              }),
            ];
          });
        } else {
          console.log("Invalid message received (missing userId or url), ignoring.");
        }
      };

      // Attach listeners
      socket.on("receive_message", handleReceiveMessage);

      socket.on("chat_count", (data: any) => {
        console.log("Chat count:", data);
        setchatCount(data);
      });

      socket.on("error", (data: any) => {
        console.log(`Error ${data}`);
      });

      // Cleanup on unmount or dependency change
      return () => {
        socket.emit("leave_chat", appId);
        socket.off("receive_message", handleReceiveMessage);
        socket.off("chat_count");
        socket.off("error");
      };
    }
  }, [activeAccount]);

  useEffect(() => {
    socket.on('update_like_count', (data: any) => {
      const { messageId, likeCount, userHasLiked } = data;

      // Update the state with the new like count and user like status
      setMessages((prevMessages: any) =>
        prevMessages.map((msg: any) =>
          msg.messageId === messageId
            ? {
              ...msg,
              likeCount, // Update likeCount
              userHasLiked, // Update userHasLiked status
            }
            : msg
        )
      );
    });

    return () => {
      socket.off('update_like_count');
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
    if (activeAccount?.derivId) {
      const appId = activeAccount.derivId;
      const messageId = generateRandomMessageId();
      let url = localStorage.getItem('userAvatar');
      if (!url) {
        url = "assets/images/avatar.png";
      }

      // Emit the GIF message
      socket.emit("send_message", { appId, message: "", gifUrl: gifUrl, url: url, messageId: messageId });

      // Add the new message to the state, initializing likeCount and userHasLiked
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          type: "gif",
          content: gifUrl,
          userId: username,
          url: url,
          message: "",
          messageId: messageId,
          likeCount: 0,            // Initialize like count
          userHasLiked: false,     // Initialize user's like status
        },
      ]);
      setIsGifVisible(false);
    }
  };

  const sendMessage = () => {
    if (message.trim() !== "" && message.length <= 250 && activeAccount?.derivId) {
      const appId = activeAccount.derivId;
      const messageId = generateRandomMessageId(); // Generate random message ID
      let url = localStorage.getItem("userAvatar");
      if (!url) {
        url = "assets/images/avatar.png";
      }

      // Extract bet ID from the message (if any)
      const betIdMatch = message.match(/share_bet:(\d+):/); // Match share_bet:<id>:
      console.log(`BetIDMatch: ${betIdMatch}, Bet Data: ${AllbetsData}`);

      let betData = [];
      let cleanedMessage = message;

      if (betIdMatch) {
        const betId = betIdMatch[1]; // Extracted bet ID from message
        // Find bet data using the extracted bet ID
        betData = AllbetsData.filter((bet: any) => String(bet.id) === String(betId));
        console.log(`BetData: ${JSON.stringify(betData)}`);

        if (betData.length > 0) {
          const roundId = betData[0]?.round_id; // Extract `round_id` from the bet data
          const roundMultiplier = Multipliers.find((mul: any) => String(mul.id) === String(roundId))?.value;

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

      // Add the new message to the state
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          type: betData.length > 0 ? "win_display" : "text", // If betData exists, it's a win_display message
          content: cleanedMessage,
          bet: betData, // Include the bet data if available, or an empty array if no bet
          userId: username,
          url: url,
          gifUrl: "",
          messageId: messageId,
          likeCount: 0, // Initialize like count
          userHasLiked: false, // Initialize user's like status
        },
      ]);

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
        {messages.map((msg, index) => (
          <div key={index} className={`aviator-chat-item ${msg.type === 'win_display' ? 'bet-display' : ''} column`}>
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
