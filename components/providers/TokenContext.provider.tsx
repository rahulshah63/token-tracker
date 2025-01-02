"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface TokenMetadata {
  decimals: number;
  name: string;
  symbol: string;
  description: string;
  iconUrl: string;
  id: string;
}

export interface Token {
  token_address: string;
  name: string;
  symbol: string;
  token_metadata: TokenMetadata;
  description: string;
  market_cap_usd: number;
  market_cap_sui: number;
  volume_24h_usd: number;
  volume_24h_sui: number;
  token_price_usd: number;
  token_price_sui: number;
  website: string;
  twitter: string;
  telegram: string;
  clmm_pool_id: string;
  is_completed: boolean;
}

export interface APIResponse {
  total: number;
  data: Token[];
}

// Define the context state interface
interface TokenContextState {
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
  isDex: boolean;
  setIsDex: (isDex: boolean) => void;
  selectedToken: Token | null;
  setSelectedToken: (token: Token | null) => void;
  tokensData: APIResponse | null;
  setTokensData: (data: APIResponse | null) => void;
}

// Create the context
const TokenContext = createContext<TokenContextState | undefined>(undefined);

// Create the provider component
interface TokenProviderProps {
  children: ReactNode;
}

export function TokenProvider({ children }: TokenProviderProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("Day");
  const [isDex, setIsDex] = useState<boolean>(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [tokensData, setTokensData] = useState<APIResponse | null>(null);

  const value = {
    selectedFilter,
    setSelectedFilter,
    isDex,
    setIsDex,
    selectedToken,
    setSelectedToken,
    tokensData,
    setTokensData,
  };

  return (
    <TokenContext.Provider value={value}>{children}</TokenContext.Provider>
  );
}

// Custom hook to use the token context
export function useTokenContext() {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error("useTokenContext must be used within a TokenProvider");
  }
  return context;
}
