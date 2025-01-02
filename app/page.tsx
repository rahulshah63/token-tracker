"use client";
import { useEffect, useState, useRef, MouseEvent } from "react";
import styles from "../styles/bubble.module.css";
import Navbar from "@/components/Navbar/Navbar";
import { Token } from "@/components/providers/TokenContext.provider";
import axios from "axios";
import { useTokenContext } from "@/components/providers/TokenContext.provider";
import Image from "next/image";
import InfoCard from "@/components/InfoCard/InfoCard";

interface IBubble {
  id: number;
  size: number;
  x: number;
  y: number;
  velocity: { x: number; y: number };
  background: string;
  hover?: boolean;
  dragged?: boolean;
  priceChange?: number;
  tokenName?: string;
}

const getBackgroundColor = (priceChange: number) => {
  if (priceChange > 0) {
    return `linear-gradient(135deg, 
      rgba(0, 255, 95, 0.95) 0%,
      rgba(0, 200, 80, 0.85) 100%)`; // Bright neon green gradient
  } else {
    return `linear-gradient(135deg, 
      rgba(255, 0, 55, 0.95) 0%,
      rgba(200, 0, 45, 0.85) 100%)`; // Deep crimson red gradient
  }
};
// Helper function to generate random values within a range
const getRandom = (min: number, max: number) =>
  Math.random() * (max - min) + min;

const calculateDistance = (x1: number, y1: number, x2: number, y2: number) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

const maxOverlap = 0.1; // 10% overlap tolerance

export default function BubblePage() {
  const containerRef = useRef<HTMLDivElement>(null); // Ref to the container element
  const [bubbles, setBubbles] = useState<IBubble[]>([]); // State to store the list of bubbles
  const activeBubbleRef = useRef<number | null>(null); // Track the currently dragged bubble
  const isDraggingRef = useRef<boolean>(false); // Track if dragging is happening

  const currentTimestamp = Date.now();
  const { selectedFilter, tokensData, selectedToken, setSelectedToken } =
    useTokenContext();

  const [priceDataMap, setPriceDataMap] = useState<Map<string, number>>(
    new Map()
  );

  const getTimePeriod = () => {
    const now = new Date();

    switch (selectedFilter) {
      case "1Hour":
        return currentTimestamp - 60 * 60 * 1000; // 1 hour ago
      case "4Hour":
        return currentTimestamp - 4 * 60 * 60 * 1000; // 4 hours ago
      case "8Hour":
        return currentTimestamp - 8 * 60 * 60 * 1000; // 8 hours ago
      case "Day": {
        // For day: Get previous day's midnight (e.g., if today is Thursday, get Wednesday midnight)
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(23, 59, 59, 999); // Set to 23:59:59.999 of previous day
        console.log(yesterday, "yesterday date");
        return yesterday.getTime();
      }
      case "Week": {
        // For week: Get last Saturday's midnight
        const lastSaturday = new Date(now);
        const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
        const daysToLastSaturday = (currentDay + 1) % 7; // Days to go back to reach last Saturday
        lastSaturday.setDate(now.getDate() - daysToLastSaturday);
        lastSaturday.setHours(23, 59, 59, 999); // Set to 23:59:59.999
        console.log(lastSaturday, "yesterday date");
        return lastSaturday.getTime();
      }
      case "Month": {
        // For month: Get last day of previous month at midnight
        const lastMonth = new Date(now);
        lastMonth.setDate(0); // Go to last day of previous month
        lastMonth.setHours(23, 59, 59, 999); // Set to 23:59:59.999
        console.log(lastMonth, "yesterday date");
        return lastMonth.getTime();
      }
      case "Year": {
        // For year: Get December 31st of previous year at midnight
        const lastYear = new Date(
          now.getFullYear() - 1,
          11,
          31,
          23,
          59,
          59,
          999
        );
        console.log(lastYear, "yesterday date");
        return lastYear.getTime();
      }
      default:
        return currentTimestamp;
    }
  };

  // const getStep = () => {
  //   switch (selectedFilter) {
  //     case "1Hour":
  //       return "hour";
  //     case "4Hour":
  //       return "4hour";
  //     case "8Hour":
  //       return "8hour";

  //     default:
  //       return "week";
  //   }
  // };

  const fetchPriceData = async (token: Token) => {
    try {
      const endpoint = token.is_completed
        ? "https://api.turbos.finance/fun/trade/clmm/ochl"
        : "https://api.turbos.finance/fun/trade/ochl";

      const params = token.is_completed
        ? {
            clmmPoolId: token.clmm_pool_id,
            start: getTimePeriod(),
            end: currentTimestamp,
            step: "hour", //uptoweek only
          }
        : {
            tokenAddress: token.token_address,
            start: getTimePeriod(),
            end: currentTimestamp,
            step: "hour", //upto week only
          };

      const response = await axios.get(endpoint, { params });
      const data = response.data;

      if (data.length > 0) {
        const priceChange =
          ((data[data.length - 1].close - data[0].open) / data[0].open) * 100;
        return priceChange;
      }
      return 0;
    } catch (error) {
      console.error("Error fetching price data:", error);
      return 0;
    }
  };

  // const fetchTokens = async () => {
  //   try {
  //     const response = await axios.get<APIResponse>(
  //       "https://api.turbos.finance/fun/pools",
  //       {
  //         params: {
  //           // search: searchQuery,
  //           sort: "market_cap_sui",
  //           completed: false,
  //           page: 1,
  //           pageSize: 100, // 24 data at once
  //           direction: "desc",
  //         },
  //       }
  //     );

  //     setTokensData(response.data);
  //   } catch (error) {
  //     console.error("Error fetching tokens:", error);
  //   }
  // };

  const updatePhysics = () => {
    setBubbles((prevBubbles) => {
      const newBubbles = [...prevBubbles];

      for (let i = 0; i < newBubbles.length; i++) {
        const bubble = newBubbles[i];
        if (activeBubbleRef.current === bubble.id) continue; // Skip active bubble

        const container = containerRef.current!;
        let newX = bubble.x + bubble.velocity.x; // Update x-position based on velocity
        let newY = bubble.y + bubble.velocity.y; // Update y-position based on velocity

        // Reverse direction if the bubble hits the left or right boundaries
        if (newX <= 0 || newX + bubble.size >= container.clientWidth) {
          bubble.velocity.x *= -1;
        }

        // Reverse direction if the bubble hits the top or bottom boundaries
        if (newY <= 0 || newY + bubble.size >= container.clientHeight) {
          bubble.velocity.y *= -1;
        }

        newX = Math.min(Math.max(newX, 0), container.clientWidth - bubble.size);
        newY = Math.min(
          Math.max(newY, 0),
          container.clientHeight - bubble.size
        );

        bubble.x = newX;
        bubble.y = newY;

        // Prevent overlap, apply gentle movements if overlap occurs
        for (let j = 0; j < newBubbles.length; j++) {
          if (i === j) continue;
          const otherBubble = newBubbles[j];
          const distance = calculateDistance(
            bubble.x + bubble.size / 2,
            bubble.y + bubble.size / 2,
            otherBubble.x + otherBubble.size / 2,
            otherBubble.y + otherBubble.size / 2
          );
          const minDistance =
            (bubble.size + otherBubble.size) * ((1 - maxOverlap) / 2);

          if (distance < minDistance) {
            const angle = Math.atan2(
              bubble.y - otherBubble.y,
              bubble.x - otherBubble.x
            );
            const moveX = Math.cos(angle) * (minDistance - distance) * 0.3; // Gentle movement
            const moveY = Math.sin(angle) * (minDistance - distance) * 0.3; // Gentle movement
            bubble.x += moveX;
            bubble.y += moveY;
          }
        }
      }

      return newBubbles;
    });
  };

  const handleMouseDown = (
    e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>,
    bubbleId: number | null
  ) => {
    if (activeBubbleRef.current !== null) return; // Prevent starting drag on other bubble during active drag

    isDraggingRef.current = true;
    activeBubbleRef.current = bubbleId; // Set the active bubble
    const container = containerRef.current;
    const bubbleIndex = bubbles.findIndex((b) => b.id === bubbleId);
    const bubble = bubbles[bubbleIndex];
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = bubble.x;
    const initialY = bubble.y;

    const handleMouseMove = (e: { clientX: number; clientY: number }) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      setBubbles((prevBubbles) => {
        const newBubbles = [...prevBubbles];
        newBubbles[bubbleIndex] = {
          ...bubble,
          x: Math.min(
            Math.max(initialX + deltaX, 0),
            container!.clientWidth - bubble.size
          ),
          y: Math.min(
            Math.max(initialY + deltaY, 0),
            container!.clientHeight - bubble.size
          ),
        };

        // Smooth movement of overlapping bubbles
        for (let i = 0; i < newBubbles.length; i++) {
          if (i === bubbleIndex) continue;
          const otherBubble = newBubbles[i];
          const distance = calculateDistance(
            newBubbles[bubbleIndex].x + bubble.size / 2,
            newBubbles[bubbleIndex].y + bubble.size / 2,
            otherBubble.x + otherBubble.size / 2,
            otherBubble.y + otherBubble.size / 2
          );
          const minDistance = (bubble.size + otherBubble.size) * 0.5;

          if (distance < minDistance) {
            const angle = Math.atan2(
              newBubbles[bubbleIndex].y - otherBubble.y,
              newBubbles[bubbleIndex].x - otherBubble.x
            );
            const moveX = Math.cos(angle) * (minDistance - distance) * 0.1;
            const moveY = Math.sin(angle) * (minDistance - distance) * 0.1;
            otherBubble.x -= moveX;
            otherBubble.y -= moveY;
          }
        }

        return newBubbles;
      });
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      activeBubbleRef.current = null; // Clear active bubble
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseEnter = (bubbleId: number) => {
    setBubbles((prevBubbles) =>
      prevBubbles.map((bubble) =>
        bubble.id === bubbleId ? { ...bubble, hover: true } : bubble
      )
    );
  };

  const handleMouseLeave = (bubbleId: number) => {
    setBubbles((prevBubbles) =>
      prevBubbles.map((bubble) =>
        bubble.id === bubbleId ? { ...bubble, hover: false } : bubble
      )
    );
  };

  const handleClick = (bubbleId: number) => {
    if (!isDraggingRef.current) {
      const token = tokensData?.data[bubbleId];
      setSelectedToken(token ?? null);
    }
  };

  const closeModal = () => {
    setSelectedToken(null);
  };

  useEffect(() => {
    const fetchAllPriceData = async () => {
      if (!tokensData?.data) return;

      const newPriceDataMap = new Map<string, number>();

      await Promise.all(
        tokensData.data.map(async (token) => {
          const priceChange = await fetchPriceData(token);

          newPriceDataMap.set(token.token_address, priceChange);
        })
      );

      setPriceDataMap(newPriceDataMap);
    };

    fetchAllPriceData();
  }, [tokensData, selectedFilter]);

  useEffect(() => {
    if (tokensData == null) return;

    const containerWidth = containerRef.current?.clientWidth ?? 800;
    const containerHeight = containerRef.current?.clientHeight ?? 600;

    // Calculate sizes based on market cap
    const maxMarketCap = Math.max(
      ...tokensData?.data.map((t) => t.market_cap_sui)
    );
    const minSize = 70;
    const maxSize = 200;

    const newBubbles = tokensData?.data
      .filter((token) => {
        const priceChange = priceDataMap.get(token.token_address) || 0;
        return priceChange !== 0;
      })

      .map((token, i) => {
        const priceChange = priceDataMap.get(token.token_address) || 0;

        return {
          id: i,
          size:
            minSize +
            (token.market_cap_sui / maxMarketCap) * (maxSize - minSize),
          x: getRandom(0, containerWidth - maxSize),
          y: getRandom(0, containerHeight - maxSize),
          velocity: { x: getRandom(-0.5, 0.5), y: getRandom(-0.5, 0.5) },
          background: getBackgroundColor(priceChange),
          priceChange: priceChange,
        };
      });

    setBubbles(newBubbles);

    const interval = setInterval(updatePhysics, 48);
    return () => clearInterval(interval);
  }, [tokensData, priceDataMap, selectedFilter]);

  // useEffect(() => {
  //   const BUBBLE_COUNT = 20; // Total number of bubbles to create
  //   const containerWidth = containerRef.current?.clientWidth ?? 800; // Width of the container
  //   const containerHeight = containerRef.current?.clientHeight ?? 600; // Height of the container
  //   const maxSize =
  //     Math.min(containerWidth, containerHeight) / Math.sqrt(BUBBLE_COUNT); // Dynamically adjust max size
  //   const minSize = maxSize * 0.6; // Adjust minimum size based on max size

  //   // Create bubble objects with randomized properties
  //   const newBubbles = Array.from({ length: BUBBLE_COUNT }).map((_, i) => ({
  //     id: i, // Unique identifier for each bubble
  //     size: getRandom(minSize, maxSize), // Dynamic size calculation
  //     x: getRandom(0, containerWidth - maxSize), // Random x-coordinate within the container
  //     y: getRandom(0, containerHeight - maxSize), // Random y-coordinate within the container
  //     velocity: { x: getRandom(-0.5, 0.5), y: getRandom(-0.5, 0.5) }, // Random initial velocity
  //     background: `radial-gradient(circle, rgba(255, 255, 255, 0.7), hsl(${getRandom(
  //       0,
  //       360
  //     )}, 70%, 70%))`, // Random gradient background
  //   }));

  //   setBubbles(newBubbles);

  //   // Periodically update physics
  //   const interval = setInterval(updatePhysics, 48); // Run update every 48ms (20 FPS)
  //   return () => clearInterval(interval);
  // }, []);

  return (
    <>
      <Navbar />
      <div ref={containerRef} className={styles.container}>
        {bubbles.map((bubble, idx) => {
          const token = tokensData?.data[idx]; // Retrieve the token associated with the bubble

          return (
            <div
              key={bubble.id}
              className={styles.bubble}
              style={{
                width: bubble.size,
                height: bubble.size,
                left: bubble.x,
                top: bubble.y,
                background: bubble.background,
                border: bubble.hover ? "2px solid yellow" : "none",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "white",
                fontSize: `${bubble.size * 0.2}px`,
                fontWeight: "bold",

                flexDirection: "column",
              }}
              onMouseDown={(e) => handleMouseDown(e, bubble.id)}
              onMouseEnter={() => handleMouseEnter(bubble.id)}
              onMouseLeave={() => handleMouseLeave(bubble.id)}
              onClick={() => handleClick(bubble.id)}
            >
              {/* Display the token's image */}
              {token?.token_metadata.iconUrl && (
                <Image
                  src={token.token_metadata.iconUrl}
                  alt={token?.symbol}
                  width={30}
                  height={30}
                  style={{
                    width: "30%",
                    height: "auto",
                    marginBottom: "5px",
                  }}
                />
              )}

              <span className="text-[20px]">{token?.symbol}</span>

              <div className="text-[10px]">
                {bubble.priceChange?.toFixed(3)}%
              </div>
            </div>
          );
        })}

        {selectedToken && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-[600px] relative">
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
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
