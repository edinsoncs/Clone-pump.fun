"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Connection,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";
import { FaCheckCircle, FaRegSmile } from "react-icons/fa";
import Picker from "emoji-picker-react";
import { IoMdSend } from "react-icons/io";
import { GrEmoji } from "react-icons/gr";
import { useParams } from "next/navigation";

interface Message {
  wallet: string;
  text: string;
  avatar: string;
  isTransaction?: boolean;
  color: string;
  time: string;
  coin: string;
  isVerified?: boolean;
  userLevel?: string;
  experience?: number;
  badges?: string[];
  reactions?: { [key: string]: number }; // Reacciones al mensaje
}

const ChatPage = () => {
  const [isClient, setIsClient] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>("👤");
  const [bgColor] = useState<string>("#1a1f2e");
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<
    { signature: string; date: string; amount: number }[]
  >([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [userProfiles, setUserProfiles] = useState<{
    [key: string]: {
      avatar: string;
      username: string;
      status: string;
      lastActive: Date;
    };
  }>({}); // Perfiles de usuario

  const params = useParams();
  const selectedCoin = params?.id ? params.id.toString() : "Global";

  const connection = useMemo(
    () =>
      new Connection(
        "https://solana-mainnet.g.alchemy.com/v2/6ql-X7BAsDxgnBIgakIWm6KKwN51j_Qr"
      ),
    []
  );

  const colors = [
    "#FF4500",
    "#1E90FF",
    "#32CD32",
    "#FFD700",
    "#FF69B4",
    "#9400D3",
  ];

  useEffect(() => {
    setIsClient(true);
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    // Actualizar el estado en línea del usuario cada cierto tiempo
    const interval = setInterval(() => {
      if (connected && publicKey) {
        updateUserProfile(publicKey.toBase58(), {
          lastActive: new Date(),
          status: "Online",
        });
      }
    }, 60000); // Cada minuto

    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(interval);
    };
  }, [connected, publicKey]);

  useEffect(() => {
    if (connected && publicKey && isClient) {
      connection.getBalance(publicKey).then((lamports) => {
        const solBalance = lamports / LAMPORTS_PER_SOL;
        setBalance(solBalance);

        const userLevel = determineUserLevel(solBalance);

        // Update messages to show verification and level
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.wallet === publicKey.toBase58()
              ? {
                  ...msg,
                  isVerified: solBalance >= 100,
                  userLevel,
                }
              : msg
          )
        );
      });

      connection.getSignaturesForAddress(publicKey).then((signatures) => {
        const enhancedSignatures = signatures
          .slice(0, 5)
          .map((signatureInfo) => ({
            signature: signatureInfo.signature,
            date: new Date(
              (signatureInfo.blockTime ?? 0) * 1000
            ).toLocaleDateString(),
            amount: 0.01, // Replace with actual transaction amount if available
          }));
        setTransactions(enhancedSignatures);
      });

      // Actualizar perfil del usuario
      updateUserProfile(publicKey.toBase58(), {
        avatar: selectedAvatar,
        username: `User_${publicKey.toBase58().slice(-4)}`,
        status: "Online",
        lastActive: new Date(),
      });
    }
  }, [connected, publicKey, connection, isClient, selectedAvatar]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const determineUserLevel = (balance: number): string => {
    if (balance >= 100) {
      return "Gold";
    } else if (balance >= 10) {
      return "Silver";
    } else {
      return "Bronze";
    }
  };

  // Function to get user badges based on experience
  const getUserBadges = (experience: number): string[] => {
    const badges = [];
    if (experience >= 100) badges.push("Veteran");
    if (experience >= 50) badges.push("Expert");
    if (experience >= 20) badges.push("Intermediate");
    if (experience >= 10) badges.push("Beginner");
    return badges;
  };

  // Calculate the leaderboard
  const leaderboard = useMemo(() => {
    const userMessagesCount: {
      [key: string]: { count: number; avatar: string };
    } = {};
    messages.forEach((msg) => {
      if (!userMessagesCount[msg.wallet]) {
        userMessagesCount[msg.wallet] = { count: 0, avatar: msg.avatar };
      }
      userMessagesCount[msg.wallet].count += 1;
    });

    const sortedUsers = Object.entries(userMessagesCount)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([wallet, data]) => ({
        wallet,
        count: data.count,
        avatar: data.avatar,
      }));
    return sortedUsers.slice(0, 10); // Top 10 users
  }, [messages]);

  const handleSendMessage = () => {
    if (input.trim() !== "") {
      const isTransaction = input.startsWith("tx:");
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const timestamp = new Date().toLocaleTimeString();

      const userLevel = balance !== null ? determineUserLevel(balance) : "Bronze";

      // Calculate experience (e.g., +1 per message)
      const experience = 1;

      // Get badges
      const badges = getUserBadges(experience);

      // Update last active time
      if (connected && publicKey) {
        updateUserProfile(publicKey.toBase58(), {
          lastActive: new Date(),
          status: "Online",
        });
      }

      setMessages([
        ...messages,
        {
          wallet: publicKey ? publicKey.toBase58() : "Guest",
          text: input,
          avatar: selectedAvatar,
          isTransaction,
          color: randomColor,
          time: timestamp,
          coin: selectedCoin,
          isVerified: balance !== null && balance >= 100,
          userLevel,
          experience,
          badges,
          reactions: {},
        },
      ]);
      setInput("");
      setShowEmojiPicker(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const onEmojiClick = (emojiData: any) => {
    setInput((prevInput) => prevInput + emojiData.emoji);
  };

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleReaction = (messageIndex: number, emoji: string) => {
    setMessages((prevMessages) => {
      const newMessages = [...prevMessages];
      const reactions = newMessages[messageIndex].reactions || {};
      reactions[emoji] = (reactions[emoji] || 0) + 1;
      newMessages[messageIndex].reactions = reactions;
      return newMessages;
    });
  };

  const updateUserProfile = (
    walletAddress: string,
    updates: Partial<{
      avatar: string;
      username: string;
      status: string;
      lastActive: Date;
    }>
  ) => {
    setUserProfiles((prevProfiles) => ({
      ...prevProfiles,
      [walletAddress]: {
        ...prevProfiles[walletAddress],
        ...updates,
      },
    }));
  };

  if (!isClient) {
    return null;
  }

  // Filter messages based on search term
  const filteredMessages = messages.filter(
    (msg) =>
      msg.coin === selectedCoin &&
      (msg.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.wallet.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: `linear-gradient(135deg, ${bgColor}, #2e3448)`,
        color: "white",
      }}
    >
      {/* Header */}
      <header className="p-4 flex justify-between items-center shadow-lg w-full bg-transparent">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">
            🚀 CryptoChat - {selectedCoin} Chat
          </h1>
        </div>
        <WalletModalProvider>
          <WalletMultiButton className="bg-[#1a1f2e] text-white px-4 py-2 rounded shadow-md hover:bg-[#2e3448]" />
        </WalletModalProvider>
      </header>

      <div className="flex flex-grow h-full">
        {/* Chat Section */}
        <div className="w-full md:w-3/4 flex flex-col">
          {/* Search */}
          <div className="p-4">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1f2e] text-white p-2 rounded outline-none shadow-inner"
            />
          </div>

          {/* Chat and Input Container */}
          <div className="flex-grow flex flex-col">
            {/* Chat */}
            <main className="flex-grow px-4 overflow-y-auto">
              <div className="space-y-4">
                {filteredMessages.length === 0 ? (
                  <p className="text-center text-gray-400">No messages found...</p>
                ) : (
                  filteredMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg shadow-md flex flex-col ${
                        message.isTransaction
                          ? "bg-gradient-to-r from-[#4caf50] to-[#32cd32] text-white"
                          : "bg-gradient-to-r from-[#2e3448] to-[#1a1f2e]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">
                          {userProfiles[message.wallet]?.avatar || message.avatar}
                        </span>
                        <div className="flex-1">
                          <strong style={{ color: message.color }}>
                            {userProfiles[message.wallet]?.username ||
                              `${message.wallet.slice(0, 6)}...${message.wallet.slice(-4)}`}
                          </strong>
                          {message.isVerified && (
                            <FaCheckCircle className="text-yellow-400 ml-2 inline" />
                          )}
                          <p className="text-xs text-gray-400">
                            {message.time} - Level:{" "}
                            <span
                              className={`font-bold ${
                                message.userLevel === "Gold"
                                  ? "text-yellow-500"
                                  : message.userLevel === "Silver"
                                  ? "text-gray-400"
                                  : "text-[#cd7f32]"
                              }`}
                            >
                              {message.userLevel}
                            </span>
                            {/* Mostrar estado en línea */}
                            {" | "}
                            <span
                              className={`font-bold ${
                                userProfiles[message.wallet]?.status === "Online"
                                  ? "text-green-400"
                                  : "text-gray-400"
                              }`}
                            >
                              {userProfiles[message.wallet]?.status || "Offline"}
                            </span>
                          </p>
                          {/* Display badges */}
                          {message.badges && message.badges.length > 0 && (
                            <div className="mt-1 flex gap-2 flex-wrap">
                              {message.badges.map((badge, idx) => (
                                <span
                                  key={idx}
                                  className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold"
                                >
                                  {badge}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {message.text && (
                        <p className="mt-2 break-words text-sm">{message.text}</p>
                      )}
                      {/* Reactions */}
                      <div className="mt-2 flex items-center">
                        <button
                          onClick={() => handleReaction(index, "👍")}
                          className="text-white mr-2"
                        >
                          👍 {message.reactions?.["👍"] || 0}
                        </button>
                        <button
                          onClick={() => handleReaction(index, "❤️")}
                          className="text-white mr-2"
                        >
                          ❤️ {message.reactions?.["❤️"] || 0}
                        </button>
                        <button
                          onClick={() => handleReaction(index, "😂")}
                          className="text-white mr-2"
                        >
                          😂 {message.reactions?.["😂"] || 0}
                        </button>
                        {/* Botón para agregar reacción personalizada */}
                        <button
                          onClick={() => {
                            const customEmoji = prompt("Enter an emoji:");
                            if (customEmoji) handleReaction(index, customEmoji);
                          }}
                          className="text-white"
                        >
                          <FaRegSmile />
                        </button>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef}></div>
              </div>
            </main>

            {/* Chat Input */}
            <footer className="bg-[#2e3448] p-4 flex items-center relative">
              <button
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                className="text-2xl text-white mr-2"
              >
                <GrEmoji />
              </button>
              <input
                type="text"
                placeholder="Type your message (e.g., tx:hash)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-grow bg-[#1a1f2e] text-white p-2 rounded outline-none shadow-inner"
              />
              <button
                onClick={handleSendMessage}
                className="ml-2 px-4 py-2 bg-[#FFD700] rounded text-black font-bold hover:bg-[#FF4500] transition shadow-lg"
              >
                <IoMdSend size={24} />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-16 left-4 z-10">
                  <Picker onEmojiClick={onEmojiClick} theme="dark" />
                </div>
              )}
            </footer>
          </div>
        </div>

        {/* Info Panel */}
        <aside
          className={`${
            windowWidth < 768 ? "hidden" : "block"
          } md:w-1/4 bg-[#1a1f2e] p-4 text-center flex flex-col items-center`}
        >
          {/* Wallet Info */}
          <div className="bg-gradient-to-r from-[#FFD700] to-[#FF4500] p-4 rounded-lg shadow-lg w-full mb-4">
            {connected && publicKey ? (
              <>
                <div className="flex items-center gap-4">
                  <span className="text-6xl">{selectedAvatar}</span>
                  <div className="text-left">
                    <h3 className="text-xl font-bold">Wallet Info</h3>
                    <p className="text-sm">
                      {publicKey.toBase58().slice(0, 6)}...
                      {publicKey.toBase58().slice(-4)}
                    </p>
                    <p className="text-lg text-yellow-300">
                      Balance:{" "}
                      {balance !== null
                        ? `${balance.toFixed(6)} SOL`
                        : "Loading..."}
                    </p>
                    {/* Estado en línea */}
                    <p className="text-sm text-green-400">Status: Online</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-400">
                Connect your wallet to view details.
              </p>
            )}
          </div>

          {/* Leaderboard */}
          <h3 className="mt-4 text-lg font-bold text-white">Leaderboard</h3>
          <ul className="mt-2 w-full text-left text-sm text-gray-400">
            {leaderboard.map((user, index) => (
              <li key={index} className="flex items-center gap-2 mb-2">
                <span className="font-bold text-white">{index + 1}.</span>
                <span className="text-2xl">
                  {userProfiles[user.wallet]?.avatar || user.avatar}
                </span>
                <span className="text-white">
                  {userProfiles[user.wallet]?.username ||
                    `${user.wallet.slice(0, 6)}...${user.wallet.slice(-4)}`}
                </span>
                <span className="ml-auto text-yellow-500">
                  {user.count} messages
                </span>
              </li>
            ))}
          </ul>

          {/* Avatar and Profile Editor */}
          <h3 className="mt-4 text-lg font-bold text-white">Edit Profile</h3>
          {connected && publicKey ? (
            <div className="w-full">
              <input
                type="text"
                placeholder="Username"
                value={
                  userProfiles[publicKey.toBase58()]?.username ||
                  `User_${publicKey.toBase58().slice(-4)}`
                }
                onChange={(e) =>
                  updateUserProfile(publicKey.toBase58(), {
                    username: e.target.value,
                  })
                }
                className="w-full bg-[#1a1f2e] text-white p-2 rounded mt-2"
              />
              <h4 className="text-sm font-bold text-gray-300 mt-4">Avatar</h4>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[
                  "👤",
                  "🐱",
                  "🦊",
                  "🐵",
                  "🐶",
                  "🐰",
                  "🐼",
                  "🐸",
                  "🐯",
                  "🦁",
                  "🐮",
                  "🐷",
                ].map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => {
                      setSelectedAvatar(avatar);
                      updateUserProfile(publicKey.toBase58(), { avatar });
                    }}
                    className={`p-2 rounded-lg shadow ${
                      selectedAvatar === avatar
                        ? "bg-[#FFD700] text-black"
                        : "bg-[#2e3448] text-white"
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 mt-2">
              Connect your wallet to edit your profile.
            </p>
          )}

          {/* Transaction History */}
          <h3 className="mt-6 text-lg font-bold text-white">
            Transaction History
          </h3>
          {transactions.length > 0 ? (
            <ul className="mt-2 text-left text-sm text-gray-400">
              {transactions.map((tx, index) => (
                <li key={index} className="mb-2">
                  <a
                    href={`https://explorer.solana.com/tx/${tx.signature}?cluster=mainnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-400 hover:underline"
                  >
                    {tx.signature.slice(0, 12)}...
                  </a>
                  <p>
                    Date: {tx.date} | Amount: {tx.amount} SOL
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 mt-2">
              No recent transactions found.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
};

const App = () => {
  const endpoint = `https://solana-mainnet.g.alchemy.com/v2/6ql-X7BAsDxgnBIgakIWm6KKwN51j_Qr`;
  const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <ChatPage />
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;
