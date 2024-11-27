"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Connection } from "@solana/web3.js";
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
import { FaStar } from "react-icons/fa";

const ChatPage = () => {
  const [messages, setMessages] = useState<
    {
      wallet: string;
      text: string;
      avatar: string;
      isTransaction?: boolean;
      color: string;
      time: string;
    }[]
  >([]);
  const [input, setInput] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>("👤");
  const [bgColor] = useState<string>("#1a1f2e");
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<{ signature: string }[]>([]);

  const connection = useMemo(
    () => new Connection("https://api.devnet.solana.com"),
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
    if (connected && publicKey) {
      connection.getBalance(publicKey).then((lamports) => {
        setBalance(lamports / 1e9); // Convert lamports to SOL
      });

      connection.getSignaturesForAddress(publicKey).then((signatures) => {
        setTransactions(signatures.slice(0, 5));
      });
    }
  }, [connected, publicKey, connection]);

  const handleSendMessage = () => {
    if (input.trim() !== "") {
      const isTransaction = input.startsWith("tx:");
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const timestamp = new Date().toLocaleTimeString();
      setMessages([
        ...messages,
        {
          wallet: publicKey ? publicKey.toBase58() : "Guest",
          text: input,
          avatar: selectedAvatar,
          isTransaction,
          color: randomColor,
          time: timestamp,
        },
      ]);
      setInput("");
    }
  };

  return (
    <div
      className="h-screen flex"
      style={{
        background: `linear-gradient(135deg, ${bgColor}, #2e3448)`,
        color: "white",
      }}
    >
      {/* Chat Section */}
      <div className="w-4/5 flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-[#FF4500] to-[#FFD700] p-4 flex justify-between items-center shadow-lg w-full">
          <h1 className="text-2xl font-bold text-white">🚀 CryptoChat v2</h1>
          <WalletModalProvider>
            <WalletMultiButton className="bg-white text-black px-4 py-2 rounded shadow-md hover:bg-gray-200" />
          </WalletModalProvider>
        </header>

        {/* Chat */}
        <main className="flex-grow p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <p className="text-center text-gray-400">No messages yet...</p>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg shadow-md flex flex-col ${
                    message.isTransaction
                      ? "bg-gradient-to-r from-[#4caf50] to-[#32cd32] text-white"
                      : "bg-gradient-to-r from-[#2e3448] to-[#1a1f2e]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{message.avatar}</span>
                    <div className="flex-1">
                      <strong style={{ color: message.color }}>
                        {message.wallet.slice(0, 6)}...
                        {message.wallet.slice(-4)}
                      </strong>
                      {message.isTransaction && (
                        <FaStar className="text-yellow-400 ml-2 inline" />
                      )}
                      <p className="text-xs text-gray-400">{message.time}</p>
                    </div>
                  </div>
                  <p className="mt-2">{message.text}</p>
                </div>
              ))
            )}
          </div>
        </main>

        {/* Chat Input */}
        <footer className="bg-[#2e3448] p-4 flex items-center">
          <input
            type="text"
            placeholder="Type your message (e.g., tx:hash)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow bg-[#1a1f2e] text-white p-2 rounded outline-none shadow-inner"
          />
          <button
            onClick={handleSendMessage}
            className="ml-2 px-4 py-2 bg-[#FFD700] rounded text-black font-bold hover:bg-[#FF4500] transition shadow-lg"
          >
            Send
          </button>
        </footer>
      </div>

      {/* Info Panel */}
      <aside className="w-1/5 bg-[#1a1f2e] p-4 text-center flex flex-col items-center">
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
                    {balance !== null ? `${balance} SOL` : "Loading..."}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-400">
              Connect your wallet to view details.
            </p>
          )}
        </div>

        {/* Avatar Selector */}
        <h3 className="mt-4 text-lg font-bold text-white">Change Avatar</h3>
        <div className="space-y-4 w-full">
          <div>
            <h4 className="text-sm font-bold text-gray-300">Category</h4>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {["👤", "🐱", "🦊", "🐵"].map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => setSelectedAvatar(avatar)}
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
        </div>

        {/* Transaction History */}
        <h3 className="mt-6 text-lg font-bold text-white">
          Transaction History
        </h3>
        {transactions.length > 0 ? (
          <ul className="mt-2 text-left text-sm text-gray-400">
            {transactions.map((tx, index) => (
              <li key={index} className="mb-2">
                <a
                  href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-400 hover:underline"
                >
                  {tx.signature.slice(0, 12)}...
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 mt-2">No recent transactions found.</p>
        )}
      </aside>
    </div>
  );
};

const App = () => {
  const endpoint = `https://api.devnet.solana.com`;
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
