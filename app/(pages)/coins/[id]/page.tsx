"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FaTelegramPlane, FaTwitter } from "react-icons/fa";

interface TokenDetails {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  website?: string;
  telegram?: string;
  twitter?: string;
  marketCapSol?: number;
  initialBuy?: number;
}

const TokenPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [token, setToken] = useState<TokenDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Unwrap `params` promise to access `id`
    const fetchParams = async () => {
      const unwrappedParams = await params;
      setId(unwrappedParams.id);
    };

    fetchParams();
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fetchTokenDetails = async () => {
      setLoading(true);
      setError("");

      try {
        // Fetch token metadata from Pump API (replace with actual endpoint)
        const response = await axios.get(
          `https://pumpapi.fun/api/get_metadata/${id}`
        );
        const data = response.data.result;

        // Map the response to the TokenDetails interface
        const tokenDetails: TokenDetails = {
          mint: data.address,
          name: data.name,
          symbol: data.symbol,
          description: data.description,
          image: data.image,
          website: data.extensions?.find((ext: any) => ext.type === "website")
            ?.url,
          telegram: data.extensions?.find((ext: any) => ext.type === "telegram")
            ?.url,
          twitter: data.extensions?.find((ext: any) => ext.type === "twitter")
            ?.url,
          marketCapSol: data.current_supply, // Assuming current_supply represents market cap in SOL
          initialBuy: data.initial_buy, // Replace with the correct field if different
        };

        setToken(tokenDetails);
      } catch (err) {
        console.error("Error fetching token details:", err);
        setError("Failed to load token details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTokenDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1a1f2e] text-white">
        <p>Loading token details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1a1f2e] text-white">
        <p>{error}</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1a1f2e] text-white">
        <p>Token not found.</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#1a1f2e] text-white p-4">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#ef6401] pb-4 mb-4">
        <h1 className="text-2xl font-bold text-[#ef6401]">
          {token.name} ({token.symbol})
        </h1>
        <button
          className="px-4 py-2 bg-[#ef6401] rounded text-white hover:bg-transparent hover:text-[#ef6401] border border-[#ef6401]"
          onClick={() => router.back()}
        >
          Go Back
        </button>
      </header>

      {/* Main Content */}
      <main className="flex flex-col lg:flex-row gap-6">
        {/* Left Section - Token Image */}
        <div className="flex-1">
          <img
            src={token.image}
            alt={token.name}
            className="w-full max-w-md mx-auto lg:max-w-none rounded"
          />
        </div>

        {/* Right Section - Token Details */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-2">Description</h2>
          <p className="mb-4">
            {token.description || "No description available."}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-semibold text-sm">Market Cap (SOL):</h3>
              <p>{token.marketCapSol?.toFixed(2) || "N/A"}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Initial Buy:</h3>
              <p>{token.initialBuy || "N/A"}</p>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            {token.website && (
              <a
                href={token.website}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[#ef6401] hover:underline"
              >
                Official Website
              </a>
            )}
            {token.telegram && (
              <a
                href={token.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#ef6401] hover:underline"
              >
                <FaTelegramPlane /> Telegram
              </a>
            )}
            {token.twitter && (
              <a
                href={token.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#ef6401] hover:underline"
              >
                <FaTwitter /> Twitter
              </a>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TokenPage;
