// app/swap/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { ArrowDownUp, ChevronDown, AlertTriangle, Info, BarChart, Shield, Zap } from 'lucide-react';

export default function SwapPage() {
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [selectedFromToken, setSelectedFromToken] = useState("SOL");
  const [selectedToToken, setSelectedToToken] = useState("PNUT");
  const [riskScore, setRiskScore] = useState(92);
  const [priceImpact, setPriceImpact] = useState(0.15);
  const [exchangeRate, setExchangeRate] = useState(158.42);

  const MOCK_PRICES = {
    SOL: 98.45,
    PNUT: 0.62,
    ETH: 2580,
    BTC: 43200
  };

  useEffect(() => {
    if (fromAmount) {
      const calculatedAmount = Number(fromAmount) * exchangeRate;
      setToAmount(calculatedAmount.toFixed(2));
      setPriceImpact(Math.min(0.15, Number(fromAmount) * 0.01));
    }
  }, [fromAmount, exchangeRate]);

  const TokenSelector = ({ token }: { token: string }) => (
    <button className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
      <img 
        src={`/tokens/${token.toLowerCase()}.svg`} 
        alt={token}
        className="w-6 h-6"
        onError={(e) => (e.currentTarget.src = '/tokens/default.svg')}
      />
      <span className="font-semibold">{token}</span>
      <ChevronDown className="w-4 h-4 text-gray-400" />
    </button>
  );

  const Pool = ({ name, apy, risk, tvl, volume }: { 
    name: string; 
    apy: string; 
    risk: number;
    tvl: string;
    volume: string;
  }) => (
    <div className="group p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors cursor-pointer">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSoqh8lAbS8Pq8WrRxQKXqzQCdAG0fiHNqYPw&s" className="w-6 h-6 rounded-full" />
            <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/33788.png" className="w-6 h-6 rounded-full" />
          </div>
          <span className="font-medium">{name}</span>
        </div>
        <span className="text-green-400">{apy}% APY</span>
      </div>
      <div className="flex justify-between text-sm text-gray-400 mb-2">
        <div className="flex items-center gap-1">
          <Info className="w-4 h-4" />
          <span>TVL: {tvl}</span>
        </div>
        <span>24h Vol: {volume}</span>
      </div>
      <div className="flex justify-between text-sm text-gray-400">
        <span>Risk Score</span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-gray-700 rounded-full">
            <div 
              className="h-full bg-purple-500 rounded-full transition-all" 
              style={{ width: `${risk}%` }}
            />
          </div>
          <span>{risk}/100</span>
        </div>
      </div>
    </div>
  );

  const TransactionDetails = () => (
    <div className="bg-gray-800 p-4 rounded-xl space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-400 flex items-center gap-1">
          Rate <Info className="w-4 h-4" />
        </span>
        <span>1 {selectedFromToken} = {exchangeRate.toFixed(2)} {selectedToToken}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400 flex items-center gap-1">
          Price Impact <Info className="w-4 h-4" />
        </span>
        <span className={priceImpact > 0.1 ? 'text-yellow-500' : ''}>
          {priceImpact.toFixed(2)}%
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400 flex items-center gap-1">
          Network Fee <Info className="w-4 h-4" />
        </span>
        <span>$0.78</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400 flex items-center gap-1">
          Minimum Received <Info className="w-4 h-4" />
        </span>
        <span>{(Number(toAmount) * 0.995).toFixed(2)} {selectedToToken}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <img 
                src="https://framerusercontent.com/images/0clRToM50Dogx1U25rQRSBF9I2A.png" 
                className="w-8 h-8"
                alt="PNUT Logo"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                PNUT SWAP
              </span>
            </div>
            <div className="flex gap-6 text-gray-400">
              <button className="flex items-center gap-2 hover:text-purple-500 transition-colors">
                <ArrowDownUp className="w-5 h-5" /> Swap
              </button>
              <button className="flex items-center gap-2 hover:text-purple-500 transition-colors">
                <BarChart className="w-5 h-5" /> Pools
              </button>
              <button className="flex items-center gap-2 hover:text-purple-500 transition-colors">
                <Shield className="w-5 h-5" /> Security
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="font-medium">Mainnet</span>
            </div>
            <w3m-button />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-850 rounded-2xl p-6 border border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Cross-Chain Swap</h1>
              <div className="flex items-center gap-2 text-sm bg-gray-800 px-3 py-1 rounded-full">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span>Risk Score: {riskScore}/100</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-800 p-4 rounded-xl">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>From</span>
                  <span>Balance: 10.5 ≈ ${(10.5 * MOCK_PRICES[selectedFromToken as keyof typeof MOCK_PRICES]).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    placeholder="0.0"
                    className="bg-transparent text-2xl w-full outline-none"
                  />
                  <TokenSelector token={selectedFromToken} />
                </div>
              </div>

              <div className="flex justify-center -my-4">
                <button className="p-2 bg-gray-800 rounded-full border-4 border-gray-900 hover:bg-gray-700 transition-colors">
                  <ArrowDownUp className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-gray-800 p-4 rounded-xl">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>To</span>
                  <span>Balance: 25.8 ≈ ${(25.8 * MOCK_PRICES[selectedToToken as keyof typeof MOCK_PRICES]).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <input
                    type="number"
                    value={toAmount}
                    readOnly
                    placeholder="0.0"
                    className="bg-transparent text-2xl w-full outline-none text-gray-400"
                  />
                  <TokenSelector token={selectedToToken} />
                </div>
              </div>

              {fromAmount && <TransactionDetails />}

              <div className="bg-gray-800 p-4 rounded-xl space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1">
                    Slippage Tolerance <Info className="w-4 h-4" />
                  </span>
                  <span className="text-purple-500">{slippage}%</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {['0.1', '0.5', '1', 'Custom'].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSlippage(value === 'Custom' ? slippage : value)}
                      className={`py-2 rounded-lg text-sm transition-colors ${
                        slippage === value ? 'bg-purple-500' : 'bg-gray-750 hover:bg-gray-700'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                className={`w-full py-4 rounded-xl font-semibold transition-all bg-purple-500 hover:bg-purple-600`}
              >
                Connect Wallet
              </button>
            </div>
          </div>

          <div className="bg-gray-850 p-6 rounded-xl border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Price Chart</h3>
              <div className="flex gap-2 text-sm">
                <button className="px-3 py-1 bg-gray-800 rounded-lg">24H</button>
                <button className="px-3 py-1 bg-gray-800 rounded-lg">1W</button>
                <button className="px-3 py-1 bg-purple-500 rounded-lg">1M</button>
              </div>
            </div>
            <div className="h-48 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">
              <span>Chart Data Unavailable (Demo Preview)</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold">Secure Liquidity Pools</h2>
          <div className="space-y-4">
            <Pool name="SOL/PNUT" apy="24.5" risk={95} tvl="$1.2M" volume="$250K" />
            <Pool name="ETH/PNUT" apy="18.2" risk={89} tvl="$850K" volume="$180K" />
            <Pool name="BTC/PNUT" apy="15.8" risk={93} tvl="$2.1M" volume="$420K" />
          </div>

          <div className="bg-gray-850 p-6 rounded-xl border border-gray-800">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-500" />
              Security Features
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium">Real-time Monitoring</p>
                  <p className="text-gray-400 text-xs">24/7 anomaly detection</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                  <ArrowDownUp className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">Optimal Routing</p>
                  <p className="text-gray-400 text-xs">Multi-chain pathfinding</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <BarChart className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Audited Protocols</p>
                  <p className="text-gray-400 text-xs">Regular security audits</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-sm font-semibold mb-4">Products</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-purple-500">Swap</a></li>
                <li><a href="#" className="hover:text-purple-500">Liquidity</a></li>
                <li><a href="#" className="hover:text-purple-500">Analytics</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-purple-500">About</a></li>
                <li><a href="#" className="hover:text-purple-500">Blog</a></li>
                <li><a href="#" className="hover:text-purple-500">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Security</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-purple-500">Audits</a></li>
                <li><a href="#" className="hover:text-purple-500">Bug Bounty</a></li>
                <li><a href="#" className="hover:text-purple-500">Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-purple-500">Twitter</a></li>
                <li><a href="#" className="hover:text-purple-500">Discord</a></li>
                <li><a href="#" className="hover:text-purple-500">GitHub</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p className="mb-2">
              PNUT Swap v1.0.0-beta | Demo Environment - Not for real transactions
            </p>
            <p className="text-xs text-gray-500">
              This interface is for demonstration purposes only. All prices and values shown are simulated.
              Always conduct your own research before engaging with decentralized finance protocols.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}