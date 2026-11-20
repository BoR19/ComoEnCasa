import React from 'react';
import { MenuItem } from '../types/app';

interface OfficialLogoProps {
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

const DISH_PHOTO_BY_ID: Record<string, string> = {
  'pollo-al-horno':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/16/Pollo_al_horno_Per%C3%BA.jpg/960px-Pollo_al_horno_Per%C3%BA.jpg',
  milanesa:
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d0/Milanesa_con_papas_fritas_y_huevo_frito_%28Argentina%29.jpg/960px-Milanesa_con_papas_fritas_y_huevo_frito_%28Argentina%29.jpg',
  'picante-carne':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ad/Picante_mixto%2C_plato_boliviano.jpg/960px-Picante_mixto%2C_plato_boliviano.jpg',
  'picante-pollo':
    'https://upload.wikimedia.org/wikipedia/commons/f/fc/Picante_de_pollo.jpg',
  'picante-pata':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2c/El_Caminante_%28Aj%C3%AD_de_patas%29.jpg/960px-El_Caminante_%28Aj%C3%AD_de_patas%29.jpg',
  falso:
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6e/Falso_conejo%2C_plato_tradicional_boliviano.jpg/960px-Falso_conejo%2C_plato_tradicional_boliviano.jpg',
  saice:
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/92/SAICE_TARIJE%C3%91O.jpg/960px-SAICE_TARIJE%C3%91O.jpg',
  'guiso-fideo':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/24/Aj%C3%AD_de_fideo_plato_t%C3%ADpico_boliviano.jpg/960px-Aj%C3%AD_de_fideo_plato_t%C3%ADpico_boliviano.jpg',
  'guiso-lenteja':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/Guiso_de_lentejas_en_Rosario_2020.jpg/960px-Guiso_de_lentejas_en_Rosario_2020.jpg',
  'guiso-liza':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/77/Aj%C3%AD_de_papalisas.jpg/960px-Aj%C3%AD_de_papalisas.jpg',
  'guiso-chuno':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/43/Chairo_pace%C3%B1o.jpg/960px-Chairo_pace%C3%B1o.jpg',
  'guiso-trigo':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/54/Guiso_de_quinua.jpg/960px-Guiso_de_quinua.jpg',
  'guiso-chanfaina':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/Chanfaina_Peru.jpg/960px-Chanfaina_Peru.jpg',
  'sopa-de-pollo':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cb/Sopa_de_Pollo_-_El_Siboney_Restaurant%2C_Key_West.jpg/960px-Sopa_de_Pollo_-_El_Siboney_Restaurant%2C_Key_West.jpg',
  'sopa-de-mani':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/Sopa_de_Man%C3%AD_de_Bolivia.jpg/960px-Sopa_de_Man%C3%AD_de_Bolivia.jpg',
  lagua:
    'https://upload.wikimedia.org/wikipedia/commons/c/c7/Lagua%2C_o_K%27alapari_a_la_piedra.jpg',
  'jugo-de-pelon':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a0/Refresco_de_mocochinchi.jpg/960px-Refresco_de_mocochinchi.jpg',
  'jugo-de-linaza':
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/Refresco_de_linaza.jpg/960px-Refresco_de_linaza.jpg',
};

const DISH_PHOTO_BY_VISUAL_TYPE: Record<MenuItem['visualType'], string> = {
  'pollo-horno': DISH_PHOTO_BY_ID['pollo-al-horno'],
  milanesa: DISH_PHOTO_BY_ID.milanesa,
  'picante-carne': DISH_PHOTO_BY_ID['picante-carne'],
  'picante-pollo': DISH_PHOTO_BY_ID['picante-pollo'],
  'picante-pata': DISH_PHOTO_BY_ID['picante-pata'],
  falso: DISH_PHOTO_BY_ID.falso,
  saice: DISH_PHOTO_BY_ID.saice,
  guiso: DISH_PHOTO_BY_ID['guiso-fideo'],
  chanfaina: DISH_PHOTO_BY_ID['guiso-chanfaina'],
  'sopa-pollo': DISH_PHOTO_BY_ID['sopa-de-pollo'],
  'sopa-mani': DISH_PHOTO_BY_ID['sopa-de-mani'],
  lagua: DISH_PHOTO_BY_ID.lagua,
  'jugo-pelon': DISH_PHOTO_BY_ID['jugo-de-pelon'],
  'jugo-linaza': DISH_PHOTO_BY_ID['jugo-de-linaza'],
};

export function getDishPhotoUrl(
  visualType: MenuItem['visualType'],
  dishId?: string
): string {
  return (
    (dishId && DISH_PHOTO_BY_ID[dishId]) ||
    DISH_PHOTO_BY_VISUAL_TYPE[visualType] ||
    DISH_PHOTO_BY_ID['pollo-al-horno']
  );
}

export const DishIllustration: React.FC<{
  visualType: MenuItem['visualType'];
  dishId?: string;
  name?: string;
  className?: string;
}> = ({ visualType, dishId, name, className = 'w-full h-full' }) => {
  const [failed, setFailed] = React.useState(false);
  const src = getDishPhotoUrl(visualType, dishId);

  React.useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed) {
    return (
      <div
        className={`${className} bg-[#F4E5C8] flex flex-col items-center justify-center p-2 text-center border border-[#D9A441]/30`}
      >
        <span className="text-[10px] font-extrabold text-[#3B1F0E] line-clamp-2">
          {name || 'Como en Casa'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || 'Platillo tradicional Como en Casa'}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${className} object-cover bg-[#F4E5C8]`}
    />
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
