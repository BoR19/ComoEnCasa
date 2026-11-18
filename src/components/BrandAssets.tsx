import React from 'react';
import { MenuItem } from '../types/app';

interface OfficialLogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}

export const OfficialLogo: React.FC<OfficialLogoProps> = ({
  size = 'lg',
}) => {
  const sizeClass =
    size === 'sm'
      ? 'w-32'
      : size === 'md'
      ? 'w-44'
      : 'w-60';

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${sizeClass}`}
    >
      <img
        src="/assets/aistudio/image_c5881e23.png"
        alt="Como en Casa - Comida Tradicional • Tupiza, Potosí, Bolivia"
        referrerPolicy="no-referrer"
        className="w-full h-auto object-contain drop-shadow-md"
      />
    </div>
  );
};

export const AppIcon: React.FC<{ size?: 'xs' | 'sm' | 'md' }> = ({
  size = 'sm',
}) => {
  const sizeClass =
    size === 'xs'
      ? 'w-7 h-7 rounded-lg'
      : size === 'md'
      ? 'w-12 h-12 rounded-2xl'
      : 'w-9 h-9 rounded-xl';

  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden shrink-0 border border-[#D9A441]/50 shadow-xs select-none ${sizeClass}`}
    >
      <img
        src="/assets/aistudio/image_6ca09ee1.png"
        alt="Ícono Como en Casa"
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export const VintageCorners: React.FC<{ color?: string; opacity?: number }> = ({
  color = '#D9A441',
  opacity = 0.5,
}) => {
  const CornerSvg = ({ className }: { className: string }) => (
    <svg
      viewBox="0 0 80 80"
      className={`w-14 h-14 pointer-events-none select-none ${className}`}
      style={{ opacity }}
    >
      <path
        d="M6,74 L6,18 C6,10 10,6 18,6 L74,6"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
      />
      <path
        d="M12,56 C12,24 24,12 56,12"
        fill="none"
        stroke={color}
        strokeWidth="1.4"
      />
      <circle cx="16" cy="16" r="3" fill={color} />
      <path
        d="M22,12 C28,18 28,26 20,28 C14,30 10,24 14,18"
        fill="none"
        stroke={color}
        strokeWidth="1.4"
      />
      <path
        d="M6,38 C14,38 18,32 16,26"
        fill="none"
        stroke={color}
        strokeWidth="1.3"
      />
      <path
        d="M38,6 C38,14 32,18 26,16"
        fill="none"
        stroke={color}
        strokeWidth="1.3"
      />
    </svg>
  );

  return (
    <>
      <CornerSvg className="absolute top-3 left-3" />
      <CornerSvg className="absolute top-3 right-3 scale-x-[-1]" />
      <CornerSvg className="absolute bottom-3 left-3 scale-y-[-1]" />
      <CornerSvg className="absolute bottom-3 right-3 scale-[-1]" />
    </>
  );
};

export const DishIllustration: React.FC<{
  visualType: MenuItem['visualType'];
  className?: string;
}> = ({ visualType, className = 'w-full h-full' }) => {
  const isJuice = visualType === 'jugo-pelon' || visualType === 'jugo-linaza';
  const isSoup =
    visualType === 'sopa-pollo' ||
    visualType === 'sopa-mani' ||
    visualType === 'lagua';
  const isGuiso = visualType === 'guiso' || visualType === 'chanfaina';

  if (isJuice) {
    const liquidColor = visualType === 'jugo-pelon' ? '#C47427' : '#A98A52';
    const liquidHighlight = visualType === 'jugo-pelon' ? '#DF923E' : '#C9AA6B';
    return (
      <svg viewBox="0 0 120 96" className={className} aria-hidden="true">
        <rect width="120" height="96" rx="12" fill="#F4E5C8" />
        {/* Wood table base */}
        <ellipse cx="60" cy="80" rx="34" ry="7" fill="#D9A441" opacity="0.28" />
        {/* Tall glass */}
        <path
          d="M42,20 L78,20 L73,77 C72.5,80 47.5,80 47,77 Z"
          fill="#FFFDF7"
          stroke="#7A5A3A"
          strokeWidth="2"
        />
        {/* Liquid */}
        <path
          d="M44.5,34 L75.5,34 L71.5,75 C71,77 49,77 48.5,75 Z"
          fill={liquidColor}
        />
        <ellipse cx="60" cy="34" rx="15.5" ry="3.5" fill={liquidHighlight} />
        {/* Pelon / lemon garnish */}
        {visualType === 'jugo-pelon' ? (
          <>
            <circle cx="57" cy="63" r="6" fill="#7A3E14" />
            <circle cx="65" cy="54" r="4.5" fill="#8C4B1B" />
            <rect x="64" y="10" width="3.5" height="36" rx="1.5" transform="rotate(14 64 10)" fill="#3B1F0E" />
          </>
        ) : (
          <>
            <circle cx="76" cy="22" r="9" fill="#D9A441" stroke="#3B1F0E" strokeWidth="1.5" />
            <circle cx="76" cy="22" r="6" fill="#FFF8E8" />
            <circle cx="56" cy="56" r="1.4" fill="#3B1F0E" opacity="0.55" />
            <circle cx="63" cy="64" r="1.4" fill="#3B1F0E" opacity="0.55" />
            <circle cx="53" cy="68" r="1.2" fill="#3B1F0E" opacity="0.55" />
          </>
        )}
      </svg>
    );
  }

  if (isSoup) {
    const brothColor =
      visualType === 'sopa-mani'
        ? '#E7B963'
        : visualType === 'lagua'
        ? '#DDA447'
        : '#D9993A';
    return (
      <svg viewBox="0 0 120 96" className={className} aria-hidden="true">
        <rect width="120" height="96" rx="12" fill="#F4E5C8" />
        {/* Steam */}
        <path d="M48,22 Q44,15 49,10" fill="none" stroke="#7A5A3A" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
        <path d="M62,20 Q58,13 63,8" fill="none" stroke="#7A5A3A" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
        <path d="M74,23 Q70,16 75,11" fill="none" stroke="#7A5A3A" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
        {/* Bowl */}
        <path d="M24,42 L96,42 C94,70 78,80 60,80 C42,80 26,70 24,42 Z" fill="#3B1F0E" />
        <ellipse cx="60" cy="42" rx="36" ry="11" fill="#FFF8E8" stroke="#3B1F0E" strokeWidth="2.5" />
        <ellipse cx="60" cy="43" rx="31" ry="8.5" fill={brothColor} />
        {/* Soup garnish */}
        <circle cx="48" cy="42" r="4" fill="#FFF6E0" />
        <circle cx="66" cy="44" r="4.5" fill="#A64B2A" />
        <circle cx="58" cy="40" r="2.2" fill="#2E7D32" />
        <circle cx="71" cy="40" r="2" fill="#2E7D32" />
        <path d="M51,46 L68,46" stroke="#F8E2A6" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (isGuiso) {
    const sauceColor = visualType === 'chanfaina' ? '#B96426' : '#C6742E';
    return (
      <svg viewBox="0 0 120 96" className={className} aria-hidden="true">
        <rect width="120" height="96" rx="12" fill="#F4E5C8" />
        {/* Plate */}
        <ellipse cx="60" cy="54" rx="44" ry="26" fill="#FFFDF8" stroke="#D9A441" strokeWidth="2" />
        <ellipse cx="60" cy="53" rx="35" ry="19" fill="#FFF3D6" />
        {/* Rice side */}
        <ellipse cx="44" cy="52" rx="14" ry="11" fill="#FFFDF8" stroke="#E5D5B5" strokeWidth="1" />
        {/* Stew */}
        <ellipse cx="68" cy="53" rx="17" ry="12" fill={sauceColor} />
        <circle cx="64" cy="50" r="4" fill="#F0C778" />
        <circle cx="74" cy="54" r="4.5" fill="#7A3E14" />
        <circle cx="66" cy="58" r="3" fill="#2E7D32" />
        <circle cx="43" cy="49" r="1.5" fill="#D9A441" />
      </svg>
    );
  }

  // Platos fuertes
  const meatColor =
    visualType === 'pollo-horno'
      ? '#B45B24'
      : visualType === 'milanesa' || visualType === 'falso'
      ? '#C67F2E'
      : '#9D3B1D';

  return (
    <svg viewBox="0 0 120 96" className={className} aria-hidden="true">
      <rect width="120" height="96" rx="12" fill="#F4E5C8" />
      {/* Serving plate */}
      <ellipse cx="60" cy="53" rx="46" ry="28" fill="#FFFDF8" stroke="#D9A441" strokeWidth="2" />
      <ellipse cx="60" cy="52" rx="38" ry="22" fill="#F9ECD2" />
      {/* Rice mound */}
      <path d="M31,52 C31,41 51,41 51,52 C51,60 31,60 31,52 Z" fill="#FFFFFF" stroke="#E6D6B8" strokeWidth="1" />
      {/* Golden potatoes */}
      <ellipse cx="45" cy="64" rx="9" ry="5" fill="#E6B24C" />
      <ellipse cx="56" cy="66" rx="8" ry="4.5" fill="#D9A441" />
      {/* Fresh salad */}
      <circle cx="77" cy="61" r="6" fill="#438E46" />
      <circle cx="83" cy="57" r="4.5" fill="#5CA95F" />
      <circle cx="79" cy="60" r="2.2" fill="#C62828" />
      {/* Main protein */}
      <ellipse cx="69" cy="46" rx="18" ry="11" fill={meatColor} />
      <path d="M58,43 Q69,38 79,44" fill="none" stroke="#E8C87A" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
      {/* Chuno / garnish accent for picantes */}
      {(visualType === 'picante-carne' ||
        visualType === 'picante-pollo' ||
        visualType === 'picante-pata' ||
        visualType === 'saice') && (
        <>
          <circle cx="38" cy="61" r="4" fill="#4A2C1A" />
          <circle cx="44" cy="57" r="3.2" fill="#5D3924" />
        </>
      )}
    </svg>
  );
};

export const QrCodeSvg: React.FC<{ seed?: string; size?: number }> = ({
  seed = 'como-en-casa-mesa-5',
  size = 176,
}) => {
  // Deterministic 21x21 QR-like visual matrix
  const gridSize = 21;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const isFinder = (r: number, c: number) => {
    const inTopLeft = r < 7 && c < 7;
    const inTopRight = r < 7 && c >= gridSize - 7;
    const inBottomLeft = r >= gridSize - 7 && c < 7;
    return inTopLeft || inTopRight || inBottomLeft;
  };

  const cells: React.ReactElement[] = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (isFinder(r, c)) continue;
      // Timing patterns
      if ((r === 6 || c === 6) && (r + c) % 2 === 0) {
        cells.push(<rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#2B1A0E" />);
        continue;
      }
      const val = ((r * 17 + c * 31 + hash) ^ (r * c + 7)) % 11;
      if (val < 5) {
        cells.push(<rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#2B1A0E" />);
      }
    }
  }

  const renderFinder = (x: number, y: number) => (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="0" y="0" width="7" height="7" fill="#2B1A0E" />
      <rect x="1" y="1" width="5" height="5" fill="#FFF8E8" />
      <rect x="2" y="2" width="3" height="3" fill="#2B1A0E" />
    </g>
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`-1 -1 ${gridSize + 2} ${gridSize + 2}`}
      className="bg-[#FFF8E8] rounded-xl p-2 border border-[#D9A441]/50"
      aria-label={`Código QR ${seed}`}
    >
      <rect x="-1" y="-1" width={gridSize + 2} height={gridSize + 2} fill="#FFF8E8" />
      {renderFinder(0, 0)}
      {renderFinder(gridSize - 7, 0)}
      {renderFinder(0, gridSize - 7)}
      {cells}
    </svg>
  );
};
