import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import axios from "axios";
import Image from "next/image";

interface Token {
  clmm_pool_id?: string;
  token_address?: string;
}

interface InfoCardProps {
  name: string;
  symbol: string;
  description: string;
  iconUrl: string;
  marketCapUsd: number;
  marketCapSui: number;
  priceUsd: number;
  priceSui: number;
  website: string;
  twitter: string;
  telegram: string;
  volume24h_sui: number;
  is_completed: boolean;
  token: Token;
}

const InfoCard: React.FC<InfoCardProps> = ({
  name,
  symbol,
  description,
  iconUrl,
  marketCapUsd,
  marketCapSui,
  priceUsd,
  priceSui,
  website,
  twitter,
  telegram,
  volume24h_sui,
  is_completed,
  token,
}) => {
  const [timeframeChanges, setTimeframeChanges] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);

  const getPeriodStartTime = (period: string): number => {
    const now = new Date();
    const currentTimestamp = now.getTime();

    switch (period) {
      case "1H":
        return currentTimestamp - 60 * 60 * 1000;
      case "4H":
        return currentTimestamp - 4 * 60 * 60 * 1000;
      case "1D":
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(23, 59, 59, 999);
        return yesterday.getTime();
      case "1W":
        const lastSaturday = new Date(now);
        const daysToLastSaturday = (lastSaturday.getDay() + 1) % 7;
        lastSaturday.setDate(now.getDate() - daysToLastSaturday);
        lastSaturday.setHours(23, 59, 59, 999);
        return lastSaturday.getTime();
      case "1M":
        const lastMonth = new Date(now);
        lastMonth.setDate(0);
        lastMonth.setHours(23, 59, 59, 999);
        return lastMonth.getTime();
      case "1Y":
        return new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999).getTime();
      default:
        return currentTimestamp - 60 * 60 * 1000;
    }
  };

  const fetchPriceChange = async (period: string): Promise<number> => {
    try {
      const startTime = getPeriodStartTime(period);
      const currentTimestamp = Date.now();

      const endpoint = is_completed
        ? "https://api.turbos.finance/fun/trade/clmm/ochl"
        : "https://api.turbos.finance/fun/trade/ochl";

      const params = is_completed
        ? {
            clmmPoolId: token.clmm_pool_id,
            start: startTime,
            end: currentTimestamp,
            step: "hour",
          }
        : {
            tokenAddress: token.token_address,
            start: startTime,
            end: currentTimestamp,
            step: "hour",
          };

      const response = await axios.get(endpoint, { params });
      const data = response.data;

      if (data.length > 0) {
        return ((data[data.length - 1].close - data[0].open) / data[0].open) * 100;
      }
      return 0;
    } catch (error) {
      console.error(`Error fetching ${period} price data:`, error);
      return 0;
    }
  };

  useEffect(() => {
    const fetchAllTimeframes = async () => {
      setLoading(true);
      try {
        const periods = ["1H", "4H", "1D", "1W", "1M", "1Y"];
        const changes = await Promise.all(
          periods.map(async (period) => {
            const change = await fetchPriceChange(period);
            return [period, change];
          })
        );
        
        setTimeframeChanges(Object.fromEntries(changes));
      } catch (error) {
        console.error("Error fetching timeframes:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token && (token.clmm_pool_id || token.token_address)) {
      fetchAllTimeframes();
    }
  }, [token, is_completed]);

  return (
    <Card className="w-[600px] bg-black text-white border border-gray-800">
      <CardHeader>
        <div className="flex items-center gap-3">
          {iconUrl && (
            <Image
              src={iconUrl}
              alt={name}
              width={12}
              height={12}
              className="w-12 h-12 rounded-full"
            />
          )}
          <div>
            <h2 className="text-2xl font-bold">{name}</h2>
            <p className="text-sm text-gray-400">{symbol}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-gray-300">{description}</p>

        <div className="grid grid-cols-3 gap-2">
          {loading ? (
            <div className="col-span-3 text-center">Loading price changes...</div>
          ) : (
            Object.entries(timeframeChanges).map(([time, change]) => (
              <div
                key={time}
                className={`${
                  change >= 0 ? "bg-green-900" : "bg-red-900"
                } p-2 rounded`}
              >
                <div className={`${change >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {time}
                </div>
                <div>{change.toFixed(2)}%</div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Price (USD)</span>
            <span>${priceUsd.toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span>Price (SUI)</span>
            <span>{priceSui} SUI</span>
          </div>
          <div className="flex justify-between">
            <span>Market Cap (USD)</span>
            <span>${marketCapUsd.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Market Cap (SUI)</span>
            <span>{marketCapSui.toLocaleString()} SUI</span>
          </div>
          <div className="flex justify-between">
            <span>24h Volume (SUI)</span>
            <span>{volume24h_sui.toLocaleString()} SUI</span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex space-x-4">
          {website && (
            <a href={website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
              Website
            </a>
          )}
          {twitter && (
            <a href={twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
              Twitter
            </a>
          )}
          {telegram && (
            <a href={telegram} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
              Telegram
            </a>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default InfoCard;