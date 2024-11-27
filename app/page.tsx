"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { FaTelegramPlane, FaTwitter, FaInstagram, FaStar } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import {
  WalletProvider,
  ConnectionProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";

interface Token {
  uri: string;
  metadata: {
    name: string;
    symbol: string;
    image: string;
    website?: string;
    telegram?: string;
    twitter?: string;
    description?: string;
  };
  mint: string;
  marketCapSol?: number;
  initialBuy?: number;
}

const Home = () => {
  const [isClient, setIsClient] = useState(false);
  const [allTokens, setAllTokens] = useState<Token[]>([]); // Lista completa de tokens
  const [favorites, setFavorites] = useState<Token[]>([]); // Tokens favoritos
  const [searchQuery, setSearchQuery] = useState(""); // Input del buscador
  const [filterBy, setFilterBy] = useState("name"); // Filtrar por nombre o símbolo
  const [visibleTokens, setVisibleTokens] = useState(12); // Tokens visibles

  const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

  useEffect(() => {
    setIsClient(true);
    const savedFavorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavorites(savedFavorites);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const ws = new WebSocket("wss://pumpportal.fun/api/data");

    ws.onopen = () => {
      console.log("WebSocket connection established");
      ws.send(JSON.stringify({ method: "subscribeNewToken" }));
    };

    ws.onmessage = async (message) => {
      const data = JSON.parse(message.data);

      if (data.uri) {
        try {
          const metadata = await axios.get(data.uri);
          const tokenData: Token = {
            ...data,
            metadata: metadata.data,
          };
          setAllTokens((prev) => [tokenData, ...prev]);
        } catch (error) {
          console.error("Error fetching metadata:", error);
        }
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, [isClient]);

  const toggleFavorite = (token: Token) => {
    const updatedFavorites = favorites.some((fav) => fav.uri === token.uri)
      ? favorites.filter((fav) => fav.uri !== token.uri)
      : [...favorites, token];

    setFavorites(updatedFavorites);
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
  };

  const isFavorite = (token: Token) => favorites.some((fav) => fav.uri === token.uri);

  const filteredTokens = allTokens.filter((token) => {
    const valueToFilter = token.metadata?.[filterBy]?.toLowerCase() || "";
    return valueToFilter.includes(searchQuery.toLowerCase());
  });

  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="h-full bg-gradient-to-br from-purple-800 via-pink-500 to-red-500 text-white min-h-screen">
            {/* Navbar */}
            <nav className="flex justify-between items-center p-4 bg-black bg-opacity-50">
              <h1 className="text-3xl font-bold text-yellow-300">Hi5 Tokens</h1>
              <WalletMultiButton className="bg-yellow-300 text-black px-4 py-2 rounded" />
            </nav>

            {/* Favorites Section */}
            {favorites.length > 0 && (
              <div className="p-4 bg-black bg-opacity-30">
                <h2 className="text-2xl font-bold mb-4">Your Favorites</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {favorites.map((token, index) => (
                    <div
                      key={index}
                      className="relative bg-white bg-opacity-10 p-4 rounded shadow-lg"
                    >
                      <FaStar
                        className="absolute top-2 right-2 text-yellow-400 cursor-pointer"
                        onClick={() => toggleFavorite(token)}
                      />
                      <Image
                        src={token.metadata.image || "/placeholder.png"}
                        alt={token.metadata.name || "Token"}
                        width={80}
                        height={80}
                        className="rounded"
                      />
                      <h3 className="text-lg font-bold text-yellow-300">
                        {token.metadata.name} ({token.metadata.symbol})
                      </h3>
                      <a
                        href={`/coins/${token.mint}`}
                        className="text-sm text-blue-400 hover:underline"
                      >
                        View Details
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="p-4">
              {/* Search Bar */}
              <div className="flex gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Search tokens..."
                  className="w-full max-w-lg px-4 py-2 rounded bg-white bg-opacity-20 text-white focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                  className="px-4 py-2 rounded bg-white bg-opacity-20 text-white"
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                >
                  <option value="name">Name</option>
                  <option value="symbol">Symbol</option>
                </select>
              </div>

              {/* Token Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredTokens.slice(0, visibleTokens).map((token, index) => (
                  <div
                    key={index}
                    className="relative bg-white bg-opacity-10 p-4 rounded shadow-lg"
                  >
                    <FaStar
                      className={`absolute top-2 right-2 text-xl cursor-pointer ${
                        isFavorite(token) ? "text-yellow-400" : "text-gray-400"
                      }`}
                      onClick={() => toggleFavorite(token)}
                    />
                    <Image
                      src={token.metadata.image || "/placeholder.png"}
                      alt={token.metadata.name || "Token"}
                      width={80}
                      height={80}
                      className="rounded"
                    />
                    <h3 className="text-lg font-bold text-yellow-300">
                      {token.metadata.name} ({token.metadata.symbol})
                    </h3>
                    <a
                      href={`/coins/${token.mint}`}
                      className="text-sm text-blue-400 hover:underline"
                    >
                      View Details
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default Home;