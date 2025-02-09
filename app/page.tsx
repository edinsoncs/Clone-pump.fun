"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  FaTelegramPlane,
  FaTwitter,
  FaInstagram,
  FaStar,
  FaRegStar,
} from "react-icons/fa";
import {
  IoClose,
  IoFunnel,
  IoPulse,
  IoCalendar,
  IoChevronUp,
  IoChevronDown,
  IoSwapVertical,
} from "react-icons/io5";
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
import Image from "next/image";
import Link from "next/link";
import "@solana/wallet-adapter-react-ui/styles.css";

interface TokenMetadata {
  name?: string;
  symbol?: string;
  image?: string;
  website?: string;
  telegram?: string;
  twitter?: string;
  description?: string;
  [key: string]: unknown;
}

interface Token {
  uri: string;
  marketCapSol?: number;
  metadata?: TokenMetadata;
  initialBuy?: number;
  mint?: string;
  liquidity?: number;
  holders?: number;
  topHolders?: number[];
  contractAge?: number;
  priceVolatility?: number;
  [key: string]: unknown;
}

const Home: React.FC = () => {
  const [isClient, setIsClient] = useState<boolean>(false);
  const [allTokens, setAllTokens] = useState<Token[]>([]);
  const [favorites, setFavorites] = useState<Token[]>([]);
  const [showFavorites, setShowFavorites] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterBy, setFilterBy] = useState<"name" | "symbol">("name");
  const [filters, setFilters] = useState({
    minMarketCap: "",
    maxMarketCap: "",
    minInitialBuy: "",
    maxInitialBuy: "",
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string>("");
  const [updateInterval, setUpdateInterval] = useState<number>(1);
  const [pauseUpdates, setPauseUpdates] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<keyof Token>("marketCapSol");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [priceData, setPriceData] = useState<{ [key: string]: number[] }>({});
  const tokensPerPage = 12;

  const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

  const advancedRiskAnalysis = useCallback((token: Token) => {
    const riskFactors = {
      liquidityRisk: !token.liquidity || token.liquidity < 50 ? 3 : 1,
      holderRisk: token.topHolders?.slice(0, 5).reduce((a, b) => a + b, 0) > 60 ? 2 : 0,
      volatilityRisk: token.priceVolatility && token.priceVolatility > 15 ? 2 : 0,
      contractRisk: !token.contractAge || token.contractAge < 3 ? 1 : 0,
      socialRisk: (!token.metadata?.telegram || !token.metadata?.twitter) ? 1 : 0
    };

    const totalRisk = Object.values(riskFactors).reduce((a, b) => a + b, 0);
    const riskPercentage = Math.min(Math.max(totalRisk * 10, 10), 95);

    return {
      riskPercentage,
      riskFactors,
      riskLevel: totalRisk > 5 ? "High" : totalRisk > 3 ? "Medium" : "Low"
    };
  }, []);

  useEffect(() => {
    setIsClient(true);
    const savedFavorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavorites(savedFavorites);

    if (!isClient) return;

    let buffer: Token[] = [];
    let updateTimer: NodeJS.Timeout;

    const processBuffer = () => {
      if (!pauseUpdates && buffer.length > 0) {
        setAllTokens(prev => [...buffer, ...prev]);
        buffer = [];
      }
    };

    const ws = new WebSocket("wss://pumpportal.fun/api/data");

    ws.onopen = () => {
      ws.send(JSON.stringify({ method: "subscribeNewToken" }));
      setLoading(true);
      setConnectionError("");
      updateTimer = setInterval(processBuffer, updateInterval * 1000);
    };

    ws.onmessage = async (message: MessageEvent) => {
      try {
        const data = JSON.parse(message.data);
        if (data.uri) {
          const metadata = await axios.get<TokenMetadata>(data.uri);
          buffer.push({
            ...data,
            uri: data.uri,
            metadata: metadata.data,
            liquidity: data.liquidity || Math.random() * 100,
            holders: data.holders || Math.floor(Math.random() * 1000),
            topHolders: data.topHolders || [Math.random() * 40 + 20, Math.random() * 30, Math.random() * 20],
            contractAge: data.contractAge || Math.floor(Math.random() * 30),
            priceVolatility: data.priceVolatility || Math.random() * 30
          });
        }
      } catch (error) {
        console.error("Error processing message:", error);
      } finally {
        setLoading(false);
      }
    };

    ws.onerror = (error) => {
      setConnectionError("Connection error - Reconnecting...");
      setTimeout(() => ws.close(), 3000);
    };

    return () => {
      ws.close();
      clearInterval(updateTimer);
    };
  }, [isClient, updateInterval, pauseUpdates]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!pauseUpdates) {
        setPriceData(prev => {
          const newData = { ...prev };
          allTokens.forEach(token => {
            if (token.mint) {
              const current = newData[token.mint] || [];
              const lastPrice = current[current.length - 1] || token.initialBuy || 0;
              const newPrice = lastPrice * (1 + (Math.random() * 0.1 - 0.05));
              newData[token.mint] = [...current.slice(-23), newPrice];
            }
          });
          return newData;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [allTokens, pauseUpdates]);

  const toggleFavorite = useCallback((token: Token) => {
    setFavorites(prev => {
      const newFavorites = prev.some(fav => fav.uri === token.uri)
        ? prev.filter(fav => fav.uri !== token.uri)
        : [...prev, token];
      localStorage.setItem("favorites", JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  const calculateScore = useCallback((token: Token) => {
    let score = 0;
    const { metadata, marketCapSol } = token;
    
    if (metadata?.website) score += 3;
    if (metadata?.telegram) score += 3;
    if (metadata?.twitter) score += 3;
    if (marketCapSol && marketCapSol >= 10) score += 1;

    return Math.min(score, 10);
  }, []);

  const filteredTokens = allTokens
    .filter(token => {
      const filterValue = (token.metadata?.[filterBy] as string)?.toLowerCase() || "";
      const marketCap = token.marketCapSol || 0;
      const initialBuy = token.initialBuy || 0;

      return (
        filterValue.includes(searchQuery.toLowerCase()) &&
        (!filters.minMarketCap || marketCap >= +filters.minMarketCap) &&
        (!filters.maxMarketCap || marketCap <= +filters.maxMarketCap) &&
        (!filters.minInitialBuy || initialBuy >= +filters.minInitialBuy) &&
        (!filters.maxInitialBuy || initialBuy <= +filters.maxInitialBuy)
      );
    })
    .sort((a, b) => {
      const aValue = a[sortBy] || 0;
      const bValue = b[sortBy] || 0;
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });

  const totalPages = Math.ceil(filteredTokens.length / tokensPerPage);
  const currentTokens = filteredTokens.slice(
    (currentPage - 1) * tokensPerPage,
    currentPage * tokensPerPage
  );

  if (!isClient) return null;

  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-black text-gray-100">
            <nav className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-orange-500/30">
              <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <Image
                    src="/logofun.png"
                    alt="Logo"
                    width={40}
                    height={40}
                    className="rounded-lg bg-orange-500/20 p-1"
                  />
                  <div className="hidden md:flex space-x-6">
                    <Link href="/how-it-works" className="hover:text-orange-500 transition-colors">
                      How It Works
                    </Link>
                    <Link href="/advanced" className="hover:text-orange-500 transition-colors">
                      Advanced Tools
                    </Link>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <WalletMultiButton className="bg-orange-500/90 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors backdrop-blur-sm" />
                  <button
                    onClick={() => setShowFavorites(!showFavorites)}
                    className="bg-orange-500/90 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 backdrop-blur-sm"
                  >
                    <span>Watchlist</span>
                    <span className="bg-black/20 px-2 rounded-full">
                      {favorites.length}
                    </span>
                  </button>
                </div>
              </div>
            </nav>

            <main className="container mx-auto px-4 py-8">
              <div className="mb-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-orange-500/20 to-black/50 p-6 rounded-xl border border-orange-500/30">
                    <h3 className="text-lg font-semibold mb-2">Total Market Cap</h3>
                    <p className="text-3xl font-bold">
                      {filteredTokens.reduce((sum, token) => sum + (token.marketCapSol || 0), 0).toLocaleString()} SOL
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500/20 to-black/50 p-6 rounded-xl border border-orange-500/30">
                    <h3 className="text-lg font-semibold mb-2">New Tokens (24h)</h3>
                    <p className="text-3xl font-bold">{allTokens.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500/20 to-black/50 p-6 rounded-xl border border-orange-500/30">
                    <h3 className="text-lg font-semibold mb-2">Average Risk Score</h3>
                    <p className="text-3xl font-bold">
                      {filteredTokens.length > 0 
                        ? (filteredTokens.reduce((sum, token) => sum + advancedRiskAnalysis(token).riskPercentage, 0) / filteredTokens.length).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="text"
                    placeholder={`Search by ${filterBy}...`}
                    className="flex-1 bg-black/50 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 outline-none border border-gray-800"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  
                  <div className="flex gap-2">
                    <select
                      className="bg-black/50 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 outline-none border border-gray-800"
                      value={filterBy}
                      onChange={(e) => setFilterBy(e.target.value as "name" | "symbol")}
                    >
                      <option value="name">Name</option>
                      <option value="symbol">Symbol</option>
                    </select>

                    <div className="flex items-center gap-2">
                      <select
                        className="bg-black/50 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 outline-none border border-gray-800"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as keyof Token)}
                      >
                        <option value="marketCapSol">Market Cap</option>
                        <option value="initialBuy">Initial Buy</option>
                        <option value="liquidity">Liquidity</option>
                        <option value="holders">Holders</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="bg-black/50 p-3 rounded-xl hover:bg-gray-900 transition-colors border border-gray-800"
                      >
                        <IoSwapVertical className={`transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    <select
                      className="bg-black/50 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 outline-none border border-gray-800"
                      value={updateInterval}
                      onChange={(e) => setUpdateInterval(Number(e.target.value))}
                    >
                      <option value={1}>Real-time (1s)</option>
                      <option value={5}>Fast (5s)</option>
                      <option value={10}>Standard (10s)</option>
                      <option value={20}>Economic (20s)</option>
                    </select>

                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="bg-black/50 p-3 rounded-xl hover:bg-gray-900 transition-colors border border-gray-800"
                    >
                      <IoFunnel className="text-xl" />
                    </button>
                  </div>
                </div>

                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-black/50 rounded-xl border border-gray-800">
                    <div className="space-y-1">
                      <label className="text-sm text-gray-400">Market Cap (SOL)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          className="w-full bg-black/30 rounded-lg p-2 border border-gray-800"
                          value={filters.minMarketCap}
                          onChange={(e) => setFilters(prev => ({...prev, minMarketCap: e.target.value}))}
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          className="w-full bg-black/30 rounded-lg p-2 border border-gray-800"
                          value={filters.maxMarketCap}
                          onChange={(e) => setFilters(prev => ({...prev, maxMarketCap: e.target.value}))}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm text-gray-400">Initial Buy</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          className="w-full bg-black/30 rounded-lg p-2 border border-gray-800"
                          value={filters.minInitialBuy}
                          onChange={(e) => setFilters(prev => ({...prev, minInitialBuy: e.target.value}))}
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          className="w-full bg-black/30 rounded-lg p-2 border border-gray-800"
                          value={filters.maxInitialBuy}
                          onChange={(e) => setFilters(prev => ({...prev, maxInitialBuy: e.target.value}))}
                        />
                      </div>
                    </div>

                    <div className="flex items-end space-x-2 lg:col-span-2">
                      <button
                        onClick={() => setFilters({
                          minMarketCap: "",
                          maxMarketCap: "",
                          minInitialBuy: "",
                          maxInitialBuy: ""
                        })}
                        className="w-full bg-orange-500/90 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {connectionError && (
                <div className="mb-4 p-3 bg-red-500/20 rounded-lg border border-red-500/50 text-red-300">
                  {connectionError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentTokens.map((token, index) => (
                  <TokenCard
                    key={index}
                    token={token}
                    isFavorite={favorites.some(fav => fav.uri === token.uri)}
                    toggleFavorite={toggleFavorite}
                    calculateScore={calculateScore}
                    riskAnalysis={advancedRiskAnalysis(token)}
                    pauseUpdates={setPauseUpdates}
                    priceHistory={priceData[token.mint || ""] || []}
                  />
                ))}
                
                {loading && Array(tokensPerPage).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse bg-black/50 rounded-xl p-4 border border-gray-800">
                    <div className="aspect-square rounded-lg bg-gray-900 mb-4" />
                    <div className="h-4 bg-gray-900 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-900 rounded w-1/2 mb-4" />
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-900 rounded w-1/4" />
                      <div className="h-3 bg-gray-900 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-gray-400">
                    Showing {(currentPage - 1) * tokensPerPage + 1} - {Math.min(currentPage * tokensPerPage, filteredTokens.length)} of {filteredTokens.length}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg bg-black/50 border border-gray-800 hover:bg-gray-900 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg ${
                          currentPage === page
                            ? 'bg-orange-500 text-white'
                            : 'bg-black/50 hover:bg-gray-900 border border-gray-800'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg bg-black/50 border border-gray-800 hover:bg-gray-900 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </main>

            {showFavorites && (
              <div className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm">
                <div className="absolute right-0 top-0 h-full w-full max-w-md bg-black/95 border-l border-gray-800 shadow-2xl">
                  <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Watchlist</h2>
                    <button
                      onClick={() => setShowFavorites(false)}
                      className="p-2 hover:bg-gray-900 rounded-lg"
                    >
                      <IoClose className="text-2xl" />
                    </button>
                  </div>
                  
                  <div className="p-4 space-y-4 overflow-y-auto h-[calc(100vh-4rem)]">
                    {favorites.map((token, index) => (
                      <div key={index} className="bg-black/50 p-4 rounded-xl border border-gray-800">
                        <h3 className="font-bold truncate">
                          {token.metadata?.name || 'Unnamed Token'}
                          <span className="text-orange-500 ml-2">
                            ({token.metadata?.symbol || 'N/A'})
                          </span>
                        </h3>
                        <p className="text-sm mt-2 text-gray-400 line-clamp-3">
                          {token.metadata?.description || 'No description available'}
                        </p>
                      </div>
                    ))}
                    
                    {!favorites.length && (
                      <div className="text-center p-8 text-gray-500">
                        Your watchlist is empty - start adding tokens!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

const TokenCard = React.memo(({ token, isFavorite, toggleFavorite, calculateScore, riskAnalysis, pauseUpdates, priceHistory }: {
  token: Token,
  isFavorite: boolean,
  toggleFavorite: (token: Token) => void,
  calculateScore: (token: Token) => number,
  riskAnalysis: any,
  pauseUpdates: (state: boolean) => void,
  priceHistory: number[]
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTradeOptions, setShowTradeOptions] = useState(false);

  const Sparkline = () => (
    <div className="h-12 w-full relative">
      <svg width="100%" height="100%" viewBox="0 0 100 40" className="absolute">
        <polyline
          fill="none"
          stroke={riskAnalysis.riskLevel === 'High' ? '#ef4444' : '#f59e0b'}
          strokeWidth="1"
          points={priceHistory
            .map((p, i) => `${(i * 100 / 23).toFixed(2)},${40 - (p * 3)}`)
            .join(' ')}
        />
      </svg>
    </div>
  );

  const HolderDistribution = () => (
    <div className="relative h-16 w-16">
      <svg viewBox="0 0 32 32" className="w-full h-full">
        {token.topHolders?.slice(0, 3).map((percent, i) => {
          const cumulative = token.topHolders?.slice(0, i).reduce((a, b) => a + b, 0) || 0;
          return (
            <circle
              key={i}
              r="16"
              cx="16"
              cy="16"
              fill="none"
              stroke={i === 0 ? '#f59e0b' : i === 1 ? '#3b82f6' : '#10b981'}
              strokeWidth="32"
              strokeDasharray={`${(percent / 100) * 360} 360`}
              transform={`rotate(${-90 + cumulative * 3.6} 16 16)`}
            />
          );
        })}
      </svg>
    </div>
  );

  return (
    <div 
      className="group relative bg-gradient-to-b from-black/80 to-black/50 rounded-xl p-4 border border-gray-800 hover:border-orange-500/30 transition-all"
      onMouseEnter={() => pauseUpdates(true)}
      onMouseLeave={() => pauseUpdates(false)}
    >
      <button
        onClick={() => toggleFavorite(token)}
        className="absolute top-4 right-4 z-10 hover:scale-110 transition-transform"
      >
        {isFavorite ? (
          <FaStar className="text-2xl text-yellow-400 animate-pulse" />
        ) : (
          <FaRegStar className="text-2xl text-gray-400 hover:text-yellow-400" />
        )}
      </button>

      <div className={`absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center space-x-4 transition-opacity ${showTradeOptions ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button className="p-4 bg-green-500/20 hover:bg-green-500/30 rounded-xl border border-green-500/30">
          <span className="text-2xl">🔼</span>
          <span className="block text-sm mt-1">Buy Now</span>
        </button>
        <button className="p-4 bg-red-500/20 hover:bg-red-500/30 rounded-xl border border-red-500/30">
          <span className="text-2xl">🔽</span>
          <span className="block text-sm mt-1">Sell Now</span>
        </button>
      </div>

      <div className="space-y-4">
        <Link href={`/coins/${token.mint}`} className="block">
          <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-black to-gray-900 relative">
            <Image
              src={token.metadata?.image?.replace('ipfs://', 'https://ipfs.io/ipfs/') || '/placeholder.png'}
              alt={token.metadata?.name || 'Token image'}
              fill
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.png';
              }}
            />
          </div>
        </Link>
        
        <div className="space-y-3">
          <Link href={`/coin/${token.mint}`} className="block hover:text-orange-500">
            <h3 className="text-xl font-bold truncate">
              {token.metadata?.name || 'Unnamed Token'}
              <span className="text-orange-500 ml-2">
                ({token.metadata?.symbol || 'N/A'})
              </span>
            </h3>
          </Link>
          
          <Sparkline />

          <div className="flex items-center gap-2 text-sm">
            <span className={`${priceHistory[0] > (priceHistory[priceHistory.length - 1] || 0) ? 'text-green-400' : 'text-red-400'}`}>
              {((priceHistory[0] - (priceHistory[priceHistory.length - 1] || 0)).toFixed(2))}%
            </span>
            <span className="text-gray-400">(24h)</span>
          </div>

          <div className="flex justify-between text-sm">
            <div className="space-y-1">
              <p>Market Cap: {token.marketCapSol?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 'N/A'} SOL</p>
              <p>Initial Buy: {token.initialBuy?.toLocaleString() || 'N/A'}</p>
            </div>
            <div className="text-right">
              <div className="text-orange-500 font-bold">
                Score: {calculateScore(token)}/10
              </div>
              <div className="flex gap-1 mt-1">
                {[...Array(calculateScore(token))].map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-orange-500 rounded-full" />
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm">Risk Level:</span>
                <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                  riskAnalysis.riskLevel === 'High' ? 'bg-red-500/20 text-red-400' :
                  riskAnalysis.riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {riskAnalysis.riskPercentage}% {riskAnalysis.riskLevel}
                </div>
              </div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1"
              >
                {showAdvanced ? <IoChevronUp /> : <IoChevronDown />}
                {showAdvanced ? "Hide Analysis" : "Advanced Analysis"}
              </button>
            </div>

            {showAdvanced && (
              <div className="pt-4 border-t border-gray-800 space-y-3">
                <div className="grid grid-cols-3 items-center">
                  <HolderDistribution />
                  <div className="col-span-2 space-y-2">
                    {token.topHolders?.slice(0, 3).map((p, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-orange-500' : i === 1 ? 'bg-blue-500' : 'bg-green-500'}`} />
                        <span className="text-sm">Top {i + 1} Holder: {p.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Liquidity:</span>
                    <div className="flex items-center gap-2">
                      <span>{token.liquidity?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 'N/A'} SOL</span>
                      <div className="w-16 h-2 bg-gray-800 rounded-full">
                        <div 
                          className="h-2 bg-green-500 rounded-full" 
                          style={{ width: `${Math.min((token.liquidity || 0)/10, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Volatility:</span>
                    <div className={`flex items-center gap-1 ${
                      (token.priceVolatility || 0) > 15 ? 'text-red-400' : 'text-green-400'
                    }`}>
                      <IoPulse />
                      {token.priceVolatility?.toFixed(1)}%
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Contract Age:</span>
                    <div className="flex items-center gap-1">
                      <IoCalendar />
                      {token.contractAge || 'N/A'} days
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Unique Holders:</span>
                    <span>{token.holders?.toLocaleString() || 'N/A'}</span>
                  </div>
                </div>

                {token.metadata?.twitter && (
                  <div className="flex items-center gap-2 text-sm text-blue-400">
                    <FaTwitter />
                    <span>{(Math.random() * 10000 + 1000).toLocaleString()} followers</span>
                    <span className="text-gray-400">· {(Math.random() * 100).toFixed(0)} posts</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {token.metadata?.website && (
              <SocialLink href={token.metadata.website} label="Website" />
            )}
            {token.metadata?.twitter && (
              <SocialLink href={`https://twitter.com/${token.metadata.twitter}`} label="Twitter" />
            )}
            {token.metadata?.telegram && (
              <SocialLink href={`https://t.me/${token.metadata.telegram}`} label="Telegram" />
            )}
          </div>

          <button
            onMouseEnter={() => setShowTradeOptions(true)}
            onMouseLeave={() => setShowTradeOptions(false)}
            className="w-full mt-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg border border-orange-500/30 transition-colors"
          >
            Quick Trade
          </button>
        </div>
      </div>
    </div>
  );
});

const SocialLink = ({ href, label }: { href: string; label: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="px-3 py-1 text-sm bg-black/50 rounded-full border border-gray-800 hover:border-orange-500 hover:text-orange-500 transition-colors flex items-center gap-2"
  >
    {label === 'Twitter' && <FaTwitter />}
    {label === 'Telegram' && <FaTelegramPlane />}
    {label === 'Website' && <FaInstagram />}
    {label}
  </a>
);

export default Home;