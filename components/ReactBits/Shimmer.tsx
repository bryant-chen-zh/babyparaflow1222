import React from 'react';

interface ShimmerBlockProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

interface ShimmerTextProps {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}

interface ShimmerCircleProps {
  size?: number | string;
  className?: string;
}

/**
 * ShimmerBlock - Basic shimmer skeleton block
 */
export function ShimmerBlock({ 
  className = '', 
  width, 
  height,
  rounded = 'md'
}: ShimmerBlockProps) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div 
      className={`shimmer ${roundedClasses[rounded]} ${className}`}
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

/**
 * ShimmerText - Text line skeleton with shimmer effect
 */
export function ShimmerText({ 
  lines = 3, 
  className = '',
  lastLineWidth = '60%'
}: ShimmerTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div 
          key={index}
          className="shimmer h-3 rounded"
          style={{ 
            width: index === lines - 1 ? lastLineWidth : '100%' 
          }}
        />
      ))}
    </div>
  );
}

/**
 * ShimmerCircle - Circular shimmer skeleton
 */
export function ShimmerCircle({ 
  size = 40, 
  className = '' 
}: ShimmerCircleProps) {
  const sizeValue = typeof size === 'number' ? `${size}px` : size;
  
  return (
    <div 
      className={`shimmer rounded-full ${className}`}
      style={{ 
        width: sizeValue, 
        height: sizeValue,
        flexShrink: 0,
      }}
    />
  );
}

/**
 * Pre-built loading skeletons for specific node types
 */

// Document Node Loading Skeleton
export function DocumentSkeleton() {
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="h-14 px-5 border-b border-moxt-line-1 flex items-center gap-3 bg-moxt-fill-1/50">
        <ShimmerBlock width={32} height={32} rounded="lg" />
        <div className="flex-1 space-y-1.5">
          <ShimmerBlock width={60} height={8} rounded="sm" />
          <ShimmerBlock width={120} height={12} rounded="sm" />
        </div>
        <ShimmerBlock width={60} height={28} rounded="lg" />
      </div>
      
      {/* Content */}
      <div className="flex-1 p-6 space-y-4">
        <ShimmerBlock width="70%" height={20} rounded="sm" />
        <ShimmerText lines={4} lastLineWidth="80%" />
        <div className="pt-2">
          <ShimmerBlock width="50%" height={16} rounded="sm" />
        </div>
        <ShimmerText lines={3} lastLineWidth="65%" />
      </div>
      
      {/* Footer */}
      <div className="px-4 py-2 border-t border-moxt-line-1 bg-moxt-fill-1 flex justify-between">
        <ShimmerBlock width={60} height={12} rounded="sm" />
        <ShimmerBlock width={50} height={12} rounded="sm" />
      </div>
    </div>
  );
}

// Whiteboard Node Loading Skeleton
export function WhiteboardSkeleton() {
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="h-14 px-5 border-b border-moxt-line-1 flex items-center gap-3 bg-moxt-fill-1/50">
        <ShimmerBlock width={32} height={32} rounded="lg" />
        <div className="flex-1 space-y-1.5">
          <ShimmerBlock width={60} height={8} rounded="sm" />
          <ShimmerBlock width={100} height={12} rounded="sm" />
        </div>
        <ShimmerBlock width={80} height={28} rounded="lg" />
      </div>
      
      {/* Canvas Area - Simple placeholder */}
      <div className="flex-1 bg-moxt-fill-1 relative overflow-hidden flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Flow diagram placeholder blocks */}
          <ShimmerBlock width={140} height={48} rounded="lg" />
          <ShimmerBlock width={180} height={56} rounded="lg" />
          <div className="flex gap-8">
            <ShimmerBlock width={100} height={40} rounded="lg" />
            <ShimmerBlock width={100} height={40} rounded="lg" />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="h-8 px-4 border-t border-moxt-line-1 flex items-center gap-2 bg-white">
        <ShimmerBlock width={16} height={16} rounded="sm" />
        <ShimmerBlock width={80} height={10} rounded="sm" />
        <div className="flex-1" />
        <ShimmerBlock width={60} height={10} rounded="sm" />
      </div>
    </div>
  );
}

// Screen Node Loading Skeleton
export function ScreenSkeleton({ isWeb = false }: { isWeb?: boolean }) {
  return (
    <div className="w-full h-full flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-3 px-1" style={{ maxWidth: isWeb ? 700 : 320 }}>
        <div className="flex items-center gap-3">
          <ShimmerBlock width={40} height={40} rounded="lg" />
          <div className="space-y-1.5">
            <ShimmerBlock width={50} height={8} rounded="sm" />
            <ShimmerBlock width={80} height={14} rounded="sm" />
          </div>
        </div>
        <div className="flex gap-2">
          <ShimmerBlock width={80} height={32} rounded="lg" />
          <ShimmerBlock width={100} height={32} rounded="lg" />
        </div>
      </div>
      
      {/* Device Frame */}
      <div 
        className={`flex flex-col overflow-hidden shadow-xl bg-white ${
          isWeb ? 'rounded-lg border border-moxt-line-2' : 'rounded-[32px] border-4 border-moxt-text-1'
        }`}
        style={{ width: isWeb ? 700 : 320, height: isWeb ? 450 : 600 }}
      >
        {/* Browser Chrome / Mobile Status */}
        {isWeb ? (
          <div className="h-9 bg-moxt-fill-1 border-b border-moxt-line-1 flex items-center px-3 gap-3">
            <div className="flex gap-1.5">
              <ShimmerCircle size={10} />
              <ShimmerCircle size={10} />
              <ShimmerCircle size={10} />
            </div>
            <ShimmerBlock className="flex-1" height={24} rounded="md" />
          </div>
        ) : (
          <>
            <div className="h-7 bg-moxt-text-1 flex items-center justify-center">
              <ShimmerBlock width={80} height={16} rounded="full" className="opacity-30" />
            </div>
            <div className="h-6 bg-white flex items-center justify-between px-5 border-b border-moxt-line-1">
              <ShimmerBlock width={40} height={10} rounded="sm" />
              <div className="flex gap-1">
                <ShimmerCircle size={12} />
                <ShimmerCircle size={12} />
              </div>
            </div>
          </>
        )}
        
        {/* Content Area */}
        <div className="flex-1 p-4 space-y-4 bg-white">
          {/* Hero section */}
          <ShimmerBlock width="100%" height={120} rounded="lg" />
          {/* Content blocks */}
          <div className="space-y-3">
            <ShimmerBlock width="80%" height={16} rounded="sm" />
            <ShimmerBlock width="60%" height={12} rounded="sm" />
          </div>
          {/* Cards */}
          <div className="flex gap-3">
            <ShimmerBlock className="flex-1" height={80} rounded="lg" />
            <ShimmerBlock className="flex-1" height={80} rounded="lg" />
          </div>
        </div>
        
        {/* Mobile Bottom */}
        {!isWeb && (
          <div className="h-9 bg-moxt-text-1 flex items-center justify-center">
            <ShimmerBlock width={100} height={4} rounded="full" className="opacity-30" />
          </div>
        )}
      </div>
    </div>
  );
}

// Table Node Loading Skeleton
export function TableSkeleton() {
  return (
    <div className="h-full flex flex-col bg-white border border-moxt-line-1 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-amber-50/50 border-b border-amber-100 flex items-center gap-2">
        <ShimmerBlock width={24} height={24} rounded="md" className="!bg-amber-100" />
        <div className="flex-1 space-y-1">
          <ShimmerBlock width={60} height={8} rounded="sm" />
          <ShimmerBlock width={100} height={12} rounded="sm" />
        </div>
      </div>
      
      {/* Table Header */}
      <div className="flex border-b border-moxt-line-1 bg-moxt-fill-1">
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="flex-1 px-3 py-2 border-r border-moxt-line-1 last:border-r-0">
            <ShimmerBlock width="80%" height={10} rounded="sm" />
          </div>
        ))}
      </div>
      
      {/* Table Rows */}
      <div className="flex-1">
        {[1, 2, 3, 4, 5].map((_, rowIdx) => (
          <div key={rowIdx} className="flex border-b border-moxt-fill-2 last:border-b-0">
            {[1, 2, 3].map((_, colIdx) => (
              <div key={colIdx} className="flex-1 px-3 py-2 border-r border-moxt-fill-2 last:border-r-0">
                <ShimmerBlock 
                  width={`${60 + Math.random() * 30}%`} 
                  height={10} 
                  rounded="sm" 
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-moxt-line-1 bg-moxt-fill-1 flex justify-between">
        <ShimmerBlock width={50} height={10} rounded="sm" />
        <ShimmerBlock width={40} height={10} rounded="sm" />
      </div>
    </div>
  );
}

// Integration Node Loading Skeleton
export function IntegrationSkeleton() {
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-rose-400 to-pink-500 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-white/10 backdrop-blur-sm border-b border-white/20 flex items-center gap-3">
        <ShimmerBlock width={32} height={32} rounded="lg" className="!bg-white/20" />
        <div className="flex-1 space-y-1.5">
          <ShimmerBlock width={60} height={8} rounded="sm" className="!bg-white/20" />
          <ShimmerBlock width={100} height={12} rounded="sm" className="!bg-white/30" />
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-4 bg-white space-y-3">
        {/* Category Badge */}
        <ShimmerBlock width={80} height={20} rounded="full" />
        
        {/* Description */}
        <ShimmerText lines={2} lastLineWidth="70%" />
        
        {/* Endpoint */}
        <div className="space-y-1.5">
          <ShimmerBlock width={60} height={8} rounded="sm" />
          <ShimmerBlock width="100%" height={28} rounded="md" />
        </div>
        
        {/* Keys */}
        <div className="space-y-1.5">
          <ShimmerBlock width={80} height={8} rounded="sm" />
          <div className="flex gap-2">
            <ShimmerBlock width={60} height={20} rounded="sm" />
            <ShimmerBlock width={70} height={20} rounded="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default {
  ShimmerBlock,
  ShimmerText,
  ShimmerCircle,
  DocumentSkeleton,
  WhiteboardSkeleton,
  ScreenSkeleton,
  TableSkeleton,
  IntegrationSkeleton,
};

