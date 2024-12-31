"use client";
import { useEffect, useState, useRef, MouseEvent } from "react";
import styles from "../styles/bubble.module.css";

interface IBubble {
  id: number;
  size: number;
  x: number;
  y: number;
  velocity: { x: number; y: number };
  background: string;
  hover?: boolean;
  dragged?: boolean; // Track if bubble is being dragged
}

// Helper function to generate random values within a range
const getRandom = (min: number, max: number) => Math.random() * (max - min) + min;

const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

const maxOverlap = 0.1; // 10% overlap tolerance

export default function BubblePage(){
  const containerRef = useRef<HTMLDivElement>(null); // Ref to the container element
  const [bubbles, setBubbles] = useState<IBubble[]>([]); // State to store the list of bubbles
  const activeBubbleRef = useRef<number | null>(null); // Track the currently dragged bubble
  const isDraggingRef = useRef<boolean>(false); // Track if dragging is happening

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
        newY = Math.min(Math.max(newY, 0), container.clientHeight - bubble.size);

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
          const minDistance = (bubble.size + otherBubble.size) * ((1 - maxOverlap) / 2);

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

  const handleMouseDown = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>, bubbleId: number | null) => {
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

    const handleMouseMove = (e: { clientX: number; clientY: number; }) => {
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
      alert(`Bubble ${bubbleId + 1} clicked!`);
    }
  };

  useEffect(() => {
    const BUBBLE_COUNT = 20; // Total number of bubbles to create
    const containerWidth = containerRef.current?.clientWidth ?? 800; // Width of the container
    const containerHeight = containerRef.current?.clientHeight ?? 600; // Height of the container
    const maxSize = Math.min(containerWidth, containerHeight) / Math.sqrt(BUBBLE_COUNT); // Dynamically adjust max size
    const minSize = maxSize * 0.6; // Adjust minimum size based on max size
    
    // Create bubble objects with randomized properties
    const newBubbles = Array.from({ length: BUBBLE_COUNT }).map((_, i) => ({
      id: i, // Unique identifier for each bubble
      size: getRandom(minSize, maxSize), // Dynamic size calculation
      x: getRandom(0, containerWidth - maxSize), // Random x-coordinate within the container
      y: getRandom(0, containerHeight - maxSize), // Random y-coordinate within the container
      velocity: { x: getRandom(-0.5, 0.5), y: getRandom(-0.5, 0.5) }, // Random initial velocity
      background: `radial-gradient(circle, rgba(255, 255, 255, 0.7), hsl(${getRandom(0, 360)}, 70%, 70%))`, // Random gradient background
    }));
  
    setBubbles(newBubbles); 

    // Periodically update physics
    const interval = setInterval(updatePhysics, 48); // Run update every 48ms (20 FPS)
    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className={styles.container}>
      {bubbles.map((bubble) => (
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
          }}
          onMouseDown={(e) => handleMouseDown(e, bubble.id)} // Attach drag functionality
          onMouseEnter={() => handleMouseEnter(bubble.id)}
          onMouseLeave={() => handleMouseLeave(bubble.id)}
          onClick={() => handleClick(bubble.id)} // Only trigger if not dragging
        />
      ))}
    </div>
  );
};
