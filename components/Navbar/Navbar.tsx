"use client";

import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import axios from "axios";
import InfoCard from "../InfoCard/InfoCard";
import {
  APIResponse,
  useTokenContext,
} from "../providers/TokenContext.provider";
import Image from "next/image";
// Define interfaces matching the API response

const Navbar = () => {
  const {
    selectedFilter,
    setSelectedFilter,
    selectedToken,
    setSelectedToken,
    tokensData,
    setTokensData,
    isDex,
    setIsDex,
  } = useTokenContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [showTokenOptions, setShowTokenOptions] = useState(false);

  const timeFilters = [
    "4Hour",
    // "8Hour",
    "1Hour",
    "Day",
    "Week",
    "Month",
    "Year",
    // "Market Cap & Day",
  ];

  const changeDex = () => {
    if (isDex) setIsDex(false);
    else setIsDex(true);
  };

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await axios.get<APIResponse>(
          "https://api.turbos.finance/fun/pools",
          {
            params: {
              search: searchQuery,
              sort: "market_cap_sui",
              completed: isDex,
              page: 1,
              pageSize: 100,
              direction: "desc",
            },
          }
        );
        setTokensData(response.data);
      } catch (error) {
        console.error("Error fetching tokens:", error);
      }
    };

    fetchTokens();
  }, [searchQuery, isDex]);

  // Filter tokens based on search query
  const filteredTokens =
    tokensData?.data.filter((token) =>
      token.token_metadata.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    ) || [];

  const closeModal = () => {
    setSelectedToken(null);
    setSearchQuery("");
  };
  return (
    <div className="bg-gray-800">
      {/* Navbar */}
      <nav className="bg-gray-800  px-4 py-7">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <div className=" w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <span className="text-white text-2xl font-bold">SUI BUBBLES</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search cryptocurrency"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowTokenOptions(true)}
                className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg 
                         border border-gray-600 focus:outline-none focus:border-green-500"
              />

              {/* Token Options Dropdown */}
              {showTokenOptions && (
                <div className="absolute w-full mt-2 bg-gray-800 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="flex justify-end p-2">
                    <X
                      className="text-gray-400 hover:text-white cursor-pointer"
                      size={20}
                      onClick={() => setShowTokenOptions(false)}
                    />
                  </div>
                  {filteredTokens.length > 0 ? (
                    <ul className="py-2">
                      {filteredTokens.map((token) => (
                        <li
                          key={token.token_address}
                          className="px-4 py-2 hover:bg-gray-700 cursor-pointer text-white flex items-center justify-between"
                          onClick={() => {
                            setSearchQuery(token.token_metadata.name);
                            setShowTokenOptions(false);
                            setSelectedToken(token);
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            {token.token_metadata.iconUrl && (
                              <Image
                                src={token.token_metadata.iconUrl}
                                alt={token.name}
                                className="w-6 h-6 rounded-full"
                                width={30}
                                height={30}
                              />
                            )}
                            <span>{token.token_metadata.name}</span>
                          </div>
                          <span className="text-gray-400 text-sm">
                            {token.token_metadata.symbol}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-2 text-gray-400">
                      No tokens found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Time Period Filters */}
      <div className="max-w-7xl mx-auto px-4 py-1">
        <div className="flex space-x-2">
          {timeFilters.map((period) => (
            <button
              key={period}
              onClick={() => setSelectedFilter(period)}
              className={`px-4 py-2 rounded-lg text-white transition-colors border border-green-400
                ${
                  period === selectedFilter
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
            >
              {period}
            </button>
          ))}
          <div
            className={`flex px-4 py-2 rounded-lg text-white transition-colors border border-green-400 ${
              isDex
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            <button onClick={changeDex}>Listed on Dex</button>
          </div>
        </div>
      </div>
      {/* InfoCard Modal */}
      {selectedToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className=" p-6 rounded-lg w-[600px] relative">
            <div
              className="absolute top-2 right-2 text-white cursor-pointer"
              onClick={closeModal} // Close the modal on click
            >
              X
            </div>
            <InfoCard
              name={selectedToken.token_metadata.name}
              symbol={selectedToken.token_metadata.symbol}
              description={selectedToken.description}
              iconUrl={selectedToken.token_metadata.iconUrl}
              marketCapUsd={selectedToken.market_cap_usd}
              marketCapSui={selectedToken.market_cap_sui}
              priceUsd={selectedToken.token_price_usd}
              priceSui={selectedToken.token_price_sui}
              website={selectedToken.website}
              twitter={selectedToken.twitter}
              telegram={selectedToken.telegram}
              volume24h_sui={selectedToken.volume_24h_sui}
              is_completed={selectedToken.is_completed}
              token={selectedToken}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
