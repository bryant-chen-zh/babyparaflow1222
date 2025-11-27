import React, { useEffect, useRef } from 'react';

interface StarBorderProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
  speed?: number;
  size?: number;
  borderRadius?: number;
  active?: boolean;
}

/**
 * StarBorder - A decorative border with animated star/sparkle effect
 * Inspired by ReactBits: https://reactbits.dev/animations/star-border
 */
export function StarBorder({
  children,
  className = '',
  color = '#8A8F8A',
  speed = 8,
  size = 6,
  borderRadius = 8,
  active = true,
}: StarBorderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const star1Ref = useRef<HTMLDivElement>(null);
  const star2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current || !star1Ref.current || !star2Ref.current) return;

    let animationId: number;
    let startTime = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;

      const container = containerRef.current;
      if (!container) return;

      const width = container.offsetWidth;
      const height = container.offsetHeight;
      const perimeter = 2 * (width + height);
      
      // Calculate position along the perimeter
      const getPosition = (progress: number) => {
        const distance = (progress % 1) * perimeter;
        
        // Top edge
        if (distance < width) {
          return { x: distance, y: 0 };
        }
        // Right edge
        if (distance < width + height) {
          return { x: width, y: distance - width };
        }
        // Bottom edge
        if (distance < 2 * width + height) {
          return { x: width - (distance - width - height), y: height };
        }
        // Left edge
        return { x: 0, y: height - (distance - 2 * width - height) };
      };

      const progress1 = elapsed / speed;
      const progress2 = (elapsed / speed) + 0.5;

      const pos1 = getPosition(progress1);
      const pos2 = getPosition(progress2);

      if (star1Ref.current) {
        star1Ref.current.style.transform = `translate(${pos1.x - size/2}px, ${pos1.y - size/2}px)`;
      }
      if (star2Ref.current) {
        star2Ref.current.style.transform = `translate(${pos2.x - size/2}px, ${pos2.y - size/2}px)`;
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [active, speed, size]);

  if (!active) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      style={{ borderRadius }}
    >
      {/* Animated stars */}
      <div 
        ref={star1Ref}
        className="absolute pointer-events-none z-50"
        style={{
          width: size * 3,
          height: size * 3,
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          filter: 'blur(2px)',
          opacity: 0.8,
        }}
      />
      <div 
        ref={star2Ref}
        className="absolute pointer-events-none z-50"
        style={{
          width: size * 3,
          height: size * 3,
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          filter: 'blur(2px)',
          opacity: 0.8,
        }}
      />
      
      {/* Inner star cores */}
      <div 
        className="absolute pointer-events-none z-50"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: color,
          filter: 'blur(1px)',
          transform: star1Ref.current?.style.transform,
        }}
      />
      
      {/* Content */}
      {children}
    </div>
  );
}

export default StarBorder;
