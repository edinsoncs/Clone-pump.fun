"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";
import { FaCheckCircle, FaRegSmile, FaChartLine, FaCoins, FaExclamationTriangle, FaCrown } from "react-icons/fa";
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Picker from "emoji-picker-react";
import { IoMdSend } from "react-icons/io";
import { GrEmoji } from "react-icons/gr";
import { useParams } from "next/navigation";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

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
  reactions?: { [key: string]: number };
  sentiment?: string;
}

interface MarketData {
  price: number;
  volume: number;
  marketCap: number;
  priceChange24h: number;
  circulatingSupply: number;
}

interface RiskAnalysis {
  score: number;
  riskLevel: 'High' | 'Medium' | 'Low';
  factors: {
    volatility: number;
    liquidity: number;
    marketCapScore: number;
    securityScore: number;
    communityScore: number;
  };
}

interface SentimentAnalysis {
  score: number;
  emotion: string;
}

const advancedRiskAnalysis = (token: string): RiskAnalysis => {
  const riskFactors = {
    volatility: Math.random(),
    liquidity: Math.random(),
    marketCapScore: Math.random() * 100,
    securityScore: 80 + Math.random() * 20,
    communityScore: 50 + Math.random() * 50
  };
  
  const totalScore = (riskFactors.volatility * 30) +
    (riskFactors.liquidity * 25) +
    (riskFactors.marketCapScore * 20) +
    (riskFactors.securityScore * 15) +
    (riskFactors.communityScore * 10);

  return {
    score: totalScore,
    riskLevel: totalScore < 50 ? 'High' : totalScore < 75 ? 'Medium' : 'Low',
    factors: riskFactors
  };
};

const analyzeSentiment = (text: string): SentimentAnalysis => {
  const positiveWords = ['bull', 'moon', 'good', 'buy', 'growth', '🚀', '📈'];
  const negativeWords = ['bear', 'dump', 'scam', 'sell', 'warning', '💩', '📉'];
  const score = text.split(' ').reduce((acc, word) => {
    if (positiveWords.includes(word.toLowerCase())) return acc + 1;
    if (negativeWords.includes(word.toLowerCase())) return acc - 1;
    return acc;
  }, 0);
  
  return {
    score,
    emotion: score > 2 ? '🚀' : score > 0 ? '😊' : score < -2 ? '💀' : score < 0 ? '😞' : '😐'
  };
};

const ChatPage = () => {
  const [isClient, setIsClient] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>("👤");
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<{ signature: string; date: string; amount: number }[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'profile' | 'market' | 'risk'>('market');
  const [marketData, setMarketData] = useState<{ [key: string]: MarketData }>({});
  const [fearGreedIndex, setFearGreedIndex] = useState<number>(Math.floor(Math.random() * 100));
  const params = useParams();
  const selectedCoin = params?.id ? params.id.toString() : "SOL";
  const [userProfiles, setUserProfiles] = useState<{
    [key: string]: {
      avatar: string;
      username: string;
      status: string;
      lastActive: Date;
      portfolioValue: number;
    };
  }>({});

  const connection = useMemo(
    () => new Connection("https://solana-mainnet.g.alchemy.com/v2/6ql-X7BAsDxgnBIgakIWm6KKwN51j_Qr"),
    []
  );

  const colors = ["#FF4500", "#1E90FF", "#32CD32", "#FFD700", "#FF69B4", "#9400D3"];

  useEffect(() => {
    setIsClient(true);
    const fakeMarketData = {
      SOL: {
        price: 150 + Math.random() * 50,
        volume: 1000000 + Math.random() * 500000,
        marketCap: 50000000 + Math.random() * 20000000,
        priceChange24h: (Math.random() - 0.5) * 20,
        circulatingSupply: 350000000
      },
      BTC: {
        price: 30000 + Math.random() * 5000,
        volume: 20000000 + Math.random() * 10000000,
        marketCap: 600000000000,
        priceChange24h: (Math.random() - 0.5) * 10,
        circulatingSupply: 19000000
      }
    };
    setMarketData(fakeMarketData);
  }, []);

  useEffect(() => {
    if (connected && publicKey) {
      connection.getBalance(publicKey).then((lamports) => {
        const solBalance = lamports / LAMPORTS_PER_SOL;
        setBalance(solBalance);
      });

      connection.getSignaturesForAddress(publicKey).then((signatures) => {
        const enhancedSignatures = signatures.slice(0, 5).map((signatureInfo) => ({
          signature: signatureInfo.signature,
          date: new Date((signatureInfo.blockTime ?? 0) * 1000).toLocaleDateString(),
          amount: 0.01
        }));
        setTransactions(enhancedSignatures);
      });

      updateUserProfile(publicKey.toBase58(), {
        portfolioValue: 10000 + Math.random() * 50000
      });
    }
  }, [connected, publicKey, connection]);

  const priceData = {
    labels: ['1H', '24H', '7D', '1M', '3M'],
    datasets: [{
      label: 'Price',
      data: marketData[selectedCoin] ? [
        marketData[selectedCoin].price * 0.98,
        marketData[selectedCoin].price * 1.03,
        marketData[selectedCoin].price * 1.1,
        marketData[selectedCoin].price * 0.95,
        marketData[selectedCoin].price * 1.2
      ] : [],
      borderColor: '#4caf50',
      tension: 0.4,
    }],
  };

  const volumeData = {
    labels: ['1H', '24H', '7D', '1M', '3M'],
    datasets: [{
      label: 'Volume',
      data: marketData[selectedCoin] ? [
        marketData[selectedCoin].volume * 0.8,
        marketData[selectedCoin].volume,
        marketData[selectedCoin].volume * 1.3,
        marketData[selectedCoin].volume * 0.9,
        marketData[selectedCoin].volume * 1.5
      ] : [],
      backgroundColor: '#1E90FF',
    }],
  };

  const calculateScore = (token: string) => {
    const analysis = advancedRiskAnalysis(token);
    return analysis.score;
  };

  const RiskIndicator = ({ riskLevel }: { riskLevel: 'High' | 'Medium' | 'Low' }) => {
    const colors = { High: '#ff4444', Medium: '#ffd700', Low: '#4caf50' };
    return (
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors[riskLevel] }} />
        <span>{riskLevel} Risk</span>
      </div>
    );
  };

  const updateUserProfile = (walletAddress: string, updates: any) => {
    setUserProfiles(prev => ({
      ...prev,
      [walletAddress]: { ...prev[walletAddress], ...updates }
    }));
  };

  const handleSendMessage = () => {
    if (input.trim()) {
      const sentiment = analyzeSentiment(input);
      const newMessage: Message = {
        wallet: publicKey?.toBase58() || 'Guest',
        text: input,
        avatar: selectedAvatar,
        color: colors[Math.floor(Math.random() * colors.length)],
        time: new Date().toLocaleTimeString(),
        coin: selectedCoin,
        isVerified: (balance || 0) >= 100,
        userLevel: balance ? determineUserLevel(balance) : 'Bronze',
        experience: 1,
        badges: ['Trader'],
        reactions: {},
        sentiment: sentiment.emotion
      };
      setMessages([...messages, newMessage]);
      setInput('');
    }
  };

  const determineUserLevel = (balance: number) => {
    if (balance >= 100) return 'Gold';
    if (balance >= 50) return 'Silver';
    return 'Bronze';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <header className="p-4 flex justify-between items-center bg-gray-800 shadow-xl">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          🚀 CryptoAnalyst Pro - {selectedCoin}
        </h1>
        <WalletModalProvider>
          <WalletMultiButton className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors" />
        </WalletModalProvider>
      </header>

      <div className="flex flex-grow h-full">
        {/* Chat Section */}
        <div className="w-full md:w-2/3 flex flex-col border-r border-gray-700">
          <div className="p-4">
            <input
              type="text"
              placeholder="🔍 Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 text-white p-2 rounded-lg outline-none"
            />
          </div>

          <main className="flex-grow overflow-y-auto px-4">
            {messages.filter(m => m.coin === selectedCoin).map((msg, index) => (
              <div key={index} className={`p-4 mb-4 rounded-lg ${msg.isTransaction ? 'bg-green-900' : 'bg-gray-800'}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{msg.avatar}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold" style={{ color: msg.color }}>
                        {userProfiles[msg.wallet]?.username || `${msg.wallet.slice(0, 6)}...`}
                      </span>
                      {msg.isVerified && <FaCheckCircle className="text-yellow-400" />}
                      <span className="text-sm text-gray-400">{msg.time}</span>
                      <span className="ml-auto text-xl">{msg.sentiment}</span>
                    </div>
                    <p className="mt-1 text-gray-100">{msg.text}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {Object.entries(msg.reactions || {}).map(([emoji, count]) => (
                        <button key={emoji} className="px-2 py-1 bg-gray-700 rounded">
                          {emoji} {count}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </main>

          <footer className="p-4 bg-gray-800">
            <div className="flex items-center gap-2">
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-xl">
                😀
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-grow bg-gray-700 p-2 rounded-lg outline-none"
                placeholder="Type your message..."
              />
              <button onClick={handleSendMessage} className="p-2 bg-blue-500 rounded-lg hover:bg-blue-600">
                <IoMdSend size={20} />
              </button>
            </div>
            {showEmojiPicker && (
              <div className="mt-2">
                <Picker onEmojiClick={(e) => setInput(input + e.emoji)} />
              </div>
            )}
          </footer>
        </div>

        {/* Analytics Panel */}
        <div className="w-full md:w-1/3 bg-gray-800 p-4 flex flex-col gap-6">
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('market')} className={`flex-1 p-2 rounded-lg ${activeTab === 'market' ? 'bg-gray-700' : ''}`}>
              <FaChartLine className="inline mr-2" /> Market
            </button>
            <button onClick={() => setActiveTab('risk')} className={`flex-1 p-2 rounded-lg ${activeTab === 'risk' ? 'bg-gray-700' : ''}`}>
              <FaExclamationTriangle className="inline mr-2" /> Risk
            </button>
            <button onClick={() => setActiveTab('profile')} className={`flex-1 p-2 rounded-lg ${activeTab === 'profile' ? 'bg-gray-700' : ''}`}>
              <FaCoins className="inline mr-2" /> Profile
            </button>
          </div>

          {activeTab === 'market' && (
            <>
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-xl font-bold mb-4">📈 Market Data</h3>
                <div className="space-y-4">
                  <Line data={priceData} options={{ responsive: true, maintainAspectRatio: false }} />
                  <Bar data={volumeData} options={{ responsive: true, maintainAspectRatio: false }} />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-600 rounded">
                      <div className="text-sm">Fear & Greed</div>
                      <div className="text-2xl font-bold text-purple-400">{fearGreedIndex}</div>
                    </div>
                    <div className="p-3 bg-gray-600 rounded">
                      <div className="text-sm">24h Change</div>
                      <div className={`text-2xl font-bold ${
                        marketData[selectedCoin]?.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {marketData[selectedCoin]?.priceChange24h?.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'risk' && (
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-xl font-bold mb-4">⚠️ Risk Analysis</h3>
              {selectedCoin && (
                <>
                  <RiskIndicator riskLevel={advancedRiskAnalysis(selectedCoin).riskLevel} />
                  <div className="my-4 h-2 bg-gray-600 rounded">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded"
                      style={{ width: `${advancedRiskAnalysis(selectedCoin).score}%` }}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Volatility</span>
                      <span className="text-red-400">
                        {(advancedRiskAnalysis(selectedCoin).factors.volatility * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Liquidity</span>
                      <span className="text-green-400">
                        ${(advancedRiskAnalysis(selectedCoin).factors.liquidity * 1e6).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Market Health</span>
                      <span className="text-blue-400">
                        {advancedRiskAnalysis(selectedCoin).factors.securityScore.toFixed(1)}/100
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'profile' && connected && (
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl">{selectedAvatar}</span>
                <div>
                  <h3 className="text-xl font-bold">{userProfiles[publicKey?.toBase58() || '']?.username}</h3>
                  <p className="text-gray-400">Level: {determineUserLevel(balance || 0)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-gray-600 rounded">
                  <div className="text-sm">Portfolio Value</div>
                  <div className="text-2xl font-bold text-green-400">
                    ${userProfiles[publicKey?.toBase58() || '']?.portfolioValue?.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-gray-600 rounded">
                  <div className="text-sm">Wallet Balance</div>
                  <div className="text-xl font-bold text-blue-400">
                    {balance?.toFixed(4)} SOL
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold mb-2">🏆 Leaderboard</h4>
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-600 rounded">
                        <div className="flex items-center gap-2">
                          <FaCrown className={`text-${i === 0 ? 'yellow-400' : 'gray-400'}`} />
                          <span>Trader {i + 1}</span>
                        </div>
                        <span>${((i + 1) * 25000).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const endpoint = "https://solana-mainnet.g.alchemy.com/v2/6ql-X7BAsDxgnBIgakIWm6KKwN51j_Qr";
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter()
  ], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <ChatPage />
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;