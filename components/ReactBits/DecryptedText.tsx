import React, { useState, useEffect, useRef } from 'react';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  characters?: string;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: 'view' | 'hover';
  revealDirection?: 'start' | 'end' | 'center';
  onComplete?: () => void;
}

/**
 * DecryptedText - A text animation component that reveals text with a decryption effect
 * Inspired by ReactBits: https://reactbits.dev/text-animations/decrypted-text
 */
export function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-={}[]|;:,.<>?',
  className = '',
  parentClassName = '',
  encryptedClassName = 'text-moxt-text-4',
  animateOn = 'view',
  revealDirection = 'start',
  onComplete,
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  const getRandomChar = () => characters[Math.floor(Math.random() * characters.length)];

  const animateText = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    let iterations = 0;
    const textLength = text.length;
    const revealedChars = new Array(textLength).fill(false);
    
    const interval = setInterval(() => {
      iterations++;
      
      let newText = '';
      let revealCount = 0;
      
      // Calculate how many chars to reveal based on direction
      if (revealDirection === 'start') {
        revealCount = Math.floor((iterations / maxIterations) * textLength);
      } else if (revealDirection === 'end') {
        revealCount = Math.floor((iterations / maxIterations) * textLength);
      } else {
        revealCount = Math.floor((iterations / maxIterations) * textLength);
      }
      
      for (let i = 0; i < textLength; i++) {
        let shouldReveal = false;
        
        if (revealDirection === 'start') {
          shouldReveal = i < revealCount;
        } else if (revealDirection === 'end') {
          shouldReveal = i >= textLength - revealCount;
        } else {
          // center
          const center = textLength / 2;
          const halfRevealed = revealCount / 2;
          shouldReveal = i >= center - halfRevealed && i < center + halfRevealed;
        }
        
        if (shouldReveal || text[i] === ' ') {
          newText += text[i];
          revealedChars[i] = true;
        } else {
          newText += getRandomChar();
        }
      }
      
      setDisplayText(newText);
      
      if (iterations >= maxIterations) {
        clearInterval(interval);
        setDisplayText(text);
        setIsAnimating(false);
        setHasAnimated(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  };

  // Handle animation on view
  useEffect(() => {
    if (animateOn !== 'view') return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            animateText();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [animateOn, hasAnimated]);

  // Handle animation on hover
  useEffect(() => {
    if (animateOn !== 'hover') return;
    if (isHovering && !isAnimating) {
      animateText();
    }
  }, [isHovering, animateOn]);

  // Reset animation on text change
  useEffect(() => {
    setDisplayText(text);
    setHasAnimated(false);
  }, [text]);

  return (
    <span
      ref={containerRef}
      className={`inline-block ${parentClassName}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {displayText.split('').map((char, index) => {
        const isRevealed = char === text[index];
        return (
          <span
            key={index}
            className={`${className} ${!isRevealed && isAnimating ? encryptedClassName : ''}`}
            style={{
              transition: 'color 0.1s ease',
            }}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}

export default DecryptedText;











