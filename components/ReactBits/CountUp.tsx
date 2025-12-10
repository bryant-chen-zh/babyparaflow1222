import React, { useState, useEffect, useRef } from 'react';

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  className?: string;
  decimals?: number;
  separator?: string;
  prefix?: string;
  suffix?: string;
  onComplete?: () => void;
  easing?: 'linear' | 'easeOut' | 'easeInOut';
  animateOnChange?: boolean;
}

/**
 * CountUp - Animated number counter component
 * Inspired by ReactBits: https://reactbits.dev/text-animations/count-up
 */
export function CountUp({
  to,
  from = 0,
  duration = 1000,
  className = '',
  decimals = 0,
  separator = '',
  prefix = '',
  suffix = '',
  onComplete,
  easing = 'easeOut',
  animateOnChange = true,
}: CountUpProps) {
  const [count, setCount] = useState(from);
  const animationRef = useRef<number | null>(null);
  const previousValueRef = useRef(from);
  const startTimeRef = useRef<number | null>(null);

  // Easing functions
  const easingFunctions = {
    linear: (t: number) => t,
    easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
    easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  };

  const formatNumber = (num: number) => {
    const fixed = num.toFixed(decimals);
    if (separator) {
      const [integer, decimal] = fixed.split('.');
      const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
      return decimal ? `${formattedInteger}.${decimal}` : formattedInteger;
    }
    return fixed;
  };

  const animate = (timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easingFunctions[easing](progress);

    const currentValue = previousValueRef.current + (to - previousValueRef.current) * easedProgress;
    setCount(currentValue);

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setCount(to);
      previousValueRef.current = to;
      onComplete?.();
    }
  };

  useEffect(() => {
    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // If animateOnChange is false and this is not the initial render, skip animation
    if (!animateOnChange && previousValueRef.current !== from) {
      setCount(to);
      previousValueRef.current = to;
      return;
    }

    // Reset start time for new animation
    startTimeRef.current = null;

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [to, duration, easing]);

  // Initial animation
  useEffect(() => {
    previousValueRef.current = from;
    setCount(from);
    startTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <span className={className}>
      {prefix}{formatNumber(count)}{suffix}
    </span>
  );
}

export default CountUp;











