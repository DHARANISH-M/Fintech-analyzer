import React, { useState, useEffect } from 'react';

interface CountUpProps {
  to: number;
  duration?: number;
  isInView: boolean;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export default function CountUp({ to, duration = 2, isInView, prefix = "", suffix = "", decimals = 0 }: CountUpProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) {
      setCount(0);
      return;
    }
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / (duration * 1000), 1);
      
      const easeOutQuart = 1 - Math.pow(1 - percentage, 4);
      const currentCount = easeOutQuart * to;
      setCount(currentCount);

      if (percentage < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, to, duration]);

  const formattedCount = decimals > 0 
    ? count.toFixed(decimals) 
    : Math.floor(count).toLocaleString('en-IN');

  return (
    <span>{prefix}{formattedCount}{suffix}</span>
  );
}
