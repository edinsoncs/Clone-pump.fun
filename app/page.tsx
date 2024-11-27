"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Image from "next/image"; // Uso de next/image para optimización
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

const Home = () => {
  const [isClient, setIsClient] = useState(false);
  const [allTokens, setAllTokens] = useState([]); // Complete list of tokens
  const [favorites, setFavorites] = useState([]); // Favorite tokens
  const [showFavoritesWidget, setShowFavoritesWidget] = useState(false); // Widget visibility
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // Search input
  const [filterBy, setFilterBy] = useState("name"); // Filter type: name, symbol
  const [minMarketCap, setMinMarketCap] = useState(""); // Minimum Market Cap
  const [maxMarketCap, setMaxMarketCap] = useState(""); // Maximum Market Cap
  const [minInitialBuy, setMinInitialBuy] = useState(""); // Minimum Initial Buy
  const [maxInitialBuy, setMaxInitialBuy] = useState(""); // Maximum Initial Buy
  const [visibleTokens, setVisibleTokens] = useState(12); // Tracks how many tokens to show
  const scrollRef = useRef(null);

  const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

  // Handle client-only rendering
  useEffect(() => {
    setIsClient(true);
    const savedFavorites = JSON.parse(localStorage.getItem("favorites")) || [];
    setFavorites(savedFavorites);
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isClient) return;

    const ws = new WebSocket("wss://pumpportal.fun/api/data");

    ws.onopen = () => {
      console.log("WebSocket connection established");
      ws.send(JSON.stringify({ method: "subscribeNewToken" }));
    };

    ws.onmessage = async (message) => {
      const data = JSON.parse(message.data);
      console.log("WebSocket message received:", data);

      if (data.uri) {
        try {
          const metadata = await axios.get(data.uri);
          console.log("Fetched metadata:", metadata.data);

          const tokenData = {
            ...data,
            metadata: metadata.data,
          };

          // Add the new token to the top of the list
          setAllTokens((prev) => [tokenData, ...prev]);
        } catch (error) {
          console.error("Error fetching metadata from IPFS:", error);
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

  // Toggle favorite token
  const toggleFavorite = (token) => {
    const updatedFavorites = favorites.some((fav) => fav.uri === token.uri)
      ? favorites.filter((fav) => fav.uri !== token.uri)
      : [...favorites, token];

    setFavorites(updatedFavorites);
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
  };

  // Check if a token is a favorite
  const isFavorite = (token) =>
    favorites.some((fav) => fav.uri === token.uri);

  // Calculate the score for a token
  const calculateScore = (token) => {
    const { marketCapSol, metadata } = token;
    let score = 0;

    if (metadata?.website) score += 3;
    if (metadata?.telegram) score += 3;
    if (metadata?.twitter) score += 3;

    if (marketCapSol >= 10) {
      score += 1;
    } else {
      score = Math.min(score, 7); // Cap score at 7 if market cap is below 10 SOL
    }

    return Math.min(score, 10);
  };

  // Filter tokens based on search query and other filters
  const filteredTokens = allTokens.filter((token) => {
    const valueToFilter = token.metadata?.[filterBy]?.toLowerCase() || "";

    // Market Cap Filter
    const marketCap = token.marketCapSol || 0;
    const withinMarketCap =
      (!minMarketCap || marketCap >= parseFloat(minMarketCap)) &&
      (!maxMarketCap || marketCap <= parseFloat(maxMarketCap));

    // Initial Buy Filter
    const initialBuy = token.initialBuy || 0;
    const withinInitialBuy =
      (!minInitialBuy || initialBuy >= parseFloat(minInitialBuy)) &&
      (!maxInitialBuy || initialBuy <= parseFloat(maxInitialBuy));

    return (
      valueToFilter.includes(searchQuery.toLowerCase()) &&
      withinMarketCap &&
      withinInitialBuy
    );
  });

  // Load more tokens as user scrolls
  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 200
    ) {
      setLoading(true);
      setTimeout(() => {
        setVisibleTokens((prev) => prev + 12);
        setLoading(false);
      }, 300); // Simulate loading delay
    }
  };

  // Attach scroll event listener
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="h-full bg-[#1a1f2e] text-white relative">
            {/* Navigation Bar */}
            <nav className="flex flex-wrap justify-between w-full p-4 items-center h-fit bg-[#1a1f2e] border-b border-[#ef6401]">
              <div className="flex items-center flex-wrap">
                <a className="flex items-center" href="/board">
                  <Image
                    alt="Pump"
                    src="/logofun.png"
                    width={30}
                    height={30}
                    priority={true}
                  />
                </a>
                <div className="flex flex-col gap-2 ml-6">
                  <div className="flex gap-4">
                    <button
                      className="text-sm text-[#ef6401] hover:underline"
                      type="button"
                    >
                      [how it works]
                    </button>
                    <a
                      className="text-sm text-[#ef6401] hover:underline"
                      href="/advanced"
                    >
                      [advanced]
                    </a>
                  </div>
                  <div className="flex gap-4 items-center">
                    <a
                      className="text-sm hover:text-[#ef6401]"
                      href="https://t.me/pumpfunsupport"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaTelegramPlane size={16} />
                    </a>
                    <a
                      className="text-sm hover:text-[#ef6401]"
                      href="https://twitter.com/pumpdotfun"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaTwitter size={16} />
                    </a>
                    <a
                      className="text-sm hover:text-[#ef6401]"
                      href="https://www.instagram.com/pumpdotfun_/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaInstagram size={16} />
                    </a>
                  </div>
                </div>
              </div>
              <WalletMultiButton className="text-sm px-4 py-2 bg-[#ef6401] rounded text-white hover:bg-transparent hover:text-[#ef6401] border border-[#ef6401]" />
            </nav>
            {/* Main Content */}
            <main className="h-full p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTokens.map((token, index) => (
                  <div
                    key={index}
                    className="border border-[#ef6401] rounded bg-[#121726] p-4"
                  >
                    <FaStar
                      className={`absolute top-2 right-2 ${
                        isFavorite(token) ? "text-yellow-400" : "text-gray-500"
                      }`}
                      onClick={() => toggleFavorite(token)}
                    />
                    <Image
                      src={token.metadata?.image || "/placeholder.png"}
                      alt={token.metadata?.name || "Token Image"}
                      width={100}
                      height={100}
                      className="rounded"
                      priority
                    />
                    <h3>{token.metadata?.name}</h3>
                  </div>
                ))}
              </div>
            </main>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default Home;
