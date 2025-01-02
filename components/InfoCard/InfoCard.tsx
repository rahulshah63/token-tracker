import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import Image from "next/image";

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
}) => {
  return (
    <Card className="max-w-md mx-auto bg-gray-800 text-white border border-gray-700 shadow-md">
      <CardHeader>
        <div className="flex items-center space-x-4">
          {iconUrl && (
            <Image
              src={iconUrl}
              alt={name}
              width={10}
              height={10}
              className="w-10 h-10 rounded-full"
            />
          )}
          <div>
            <h3 className="text-lg font-bold">{name}</h3>
            <p className="text-sm text-gray-400">{symbol}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm">{description}</p>
        <div className="space-y-1">
          <div>
            <span className="font-bold">Market Cap (USD): </span>
            {marketCapUsd.toLocaleString()} USD
          </div>
          <div>
            <span className="font-bold">Market Cap (SUI): </span>
            {marketCapSui.toLocaleString()} SUI
          </div>
          <div>
            <span className="font-bold">Price (USD): </span>$
            {priceUsd.toFixed(2)}
          </div>
          <div>
            <span className="font-bold">Price (SUI): </span>
            {priceSui.toFixed(2)} SUI
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex flex-wrap space-x-3">
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:underline"
            >
              Website
            </a>
          )}
          {twitter && (
            <a
              href={twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Twitter
            </a>
          )}
          {telegram && (
            <a
              href={telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:underline"
            >
              Telegram
            </a>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default InfoCard;
