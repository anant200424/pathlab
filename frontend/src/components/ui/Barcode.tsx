'use client';

import React, { useMemo } from 'react';

interface BarcodeProps {
  value: string;
  className?: string;
  vertical?: boolean;
  height?: number;
  width?: number;
  showText?: boolean;
}

export function Barcode({
  value,
  className = '',
  vertical = false,
  height = 50,
  width = 130,
  showText = true,
}: BarcodeProps) {
  // Generate deterministic bar widths based on input string
  const bars = useMemo(() => {
    const clean = (value || '10137283').replace(/[^a-zA-Z0-9]/g, '');
    const pattern: number[] = [2, 1, 2, 1]; // start guard

    for (let i = 0; i < clean.length; i++) {
      const code = clean.charCodeAt(i);
      pattern.push((code % 3) + 1, ((code >> 1) % 2) + 1, ((code >> 2) % 3) + 1, 1);
    }

    pattern.push(2, 1, 2); // stop guard
    return pattern;
  }, [value]);

  const totalUnits = bars.reduce((a, b) => a + b, 0);

  if (vertical) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <span
          className="text-[10px] font-mono font-bold tracking-widest text-slate-800 select-none"
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
          }}
        >
          {value || '10137283'}
        </span>
        <svg
          width={28}
          height={height || 75}
          viewBox={`0 0 28 ${totalUnits * 2}`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          {(() => {
            let currentY = 0;
            return bars.map((barThickness, idx) => {
              const y = currentY;
              const h = barThickness * 2;
              currentY += h;
              // Even indices are black bars, odd are white spaces
              if (idx % 2 === 0) {
                return (
                  <rect
                    key={idx}
                    x={0}
                    y={y}
                    width={28}
                    height={h}
                    fill="#111827"
                  />
                );
              }
              return null;
            });
          })()}
        </svg>
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${totalUnits * 2} 40`}
        preserveAspectRatio="none"
        className="w-full"
      >
        {(() => {
          let currentX = 0;
          return bars.map((barThickness, idx) => {
            const x = currentX;
            const w = barThickness * 2;
            currentX += w;
            if (idx % 2 === 0) {
              return (
                <rect
                  key={idx}
                  x={x}
                  y={0}
                  width={w}
                  height={40}
                  fill="#111827"
                />
              );
            }
            return null;
          });
        })()}
      </svg>
      {showText && (
        <span className="text-[10px] font-mono tracking-wider font-semibold text-slate-700 mt-0.5">
          {value}
        </span>
      )}
    </div>
  );
}
