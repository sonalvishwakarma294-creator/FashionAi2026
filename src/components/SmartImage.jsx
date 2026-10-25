import React, { useState, useEffect, useMemo } from 'react';
import { closetService, getImageUrl, BACKEND_BASE_URL } from '../services/api';

const OCCASION_BG = {
  Casual: 'linear-gradient(135deg, #84cc16 0%, #22c55e 50%, #059669 100%)',
  Office: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 50%, #1d4ed8 100%)',
  Party: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #dc2626 100%)',
  Traditional: 'linear-gradient(135deg, #d97706 0%, #b45309 50%, #78350f 100%)',
};

const CATEGORY_EMOJI = {
  'Full Look': '👗',
  'Tops': '👚',
  'Bottoms': '👖',
  Accessories: '👜',
  Shoes: '👠',
  Jewelry: '💎',
  Bags: '👜',
  Clothing: '👗',
};

const hashString = (s = '') => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
};

const gradientFromId = (id, color) => {
  const palette = [
    ['#F97316', '#EA580C'],
    ['#8B5CF6', '#7C3AED'],
    ['#06B6D4', '#0891B2'],
    ['#EC4899', '#BE185D'],
    ['#10B981', '#047857'],
    ['#F59E0B', '#D97706'],
    ['#EF4444', '#B91C1C'],
    ['#3B82F6', '#1D4ED8'],
    ['#14B8A6', '#0F766E'],
    ['#F472B6', '#DB2777'],
  ];
  const pair = palette[(Number(id) || hashString(String(id || color || ''))) % palette.length];
  return `linear-gradient(135deg, ${pair[0]} 0%, ${pair[1]} 100%)`;
};

const Placeholder = ({ outfit, alt, style }) => {
  const occasion = outfit?.occasion || 'Casual';
  const category = outfit?.category || outfit?.datasetCategory || 'Full Look';
  const color = outfit?.color || outfit?.primaryColor;
  const name = outfit?.name || alt || '';
  const bg = OCCASION_BG[occasion] || gradientFromId(outfit?.id, color);
  const emoji = CATEGORY_EMOJI[category] || '👕';
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center text-white p-3 select-none"
      style={{ background: bg, ...style }}
    >
      <div className="text-5xl mb-2 drop-shadow-lg" aria-hidden>{emoji}</div>
      <div className="text-xs uppercase tracking-widest font-bold opacity-90 mb-1">
        {occasion}
      </div>
      {color && (
        <div className="flex items-center gap-1 text-[10px] opacity-90 mb-2">
          <span
            className="w-3 h-3 rounded-full border border-white/60 shadow"
            style={{ backgroundColor: outfit?.hex || '#ffffff' }}
          />
          <span>{color}</span>
        </div>
      )}
      {name && (
        <div className="text-[11px] leading-tight text-center font-semibold opacity-95 line-clamp-3 px-1">
          {name.replace(/^[A-Za-z]+\s*#\d+:\s*/, '')}
        </div>
      )}
    </div>
  );
};

const SmartImage = ({
  src,
  alt,
  outfit,
  className = '',
  imgClassName = '',
  style,
  wrapperClassName = '',
}) => {
  const resolved = getImageUrl(src);
  const privateImageId = /^\/api\/closet\/items\/(\d+)\/image$/.exec(resolved)?.[1] || null;
  const backendFallback = useMemo(() => {
    if (!resolved || privateImageId) return '';
    if (resolved.startsWith('http') || resolved.startsWith('data:')) return '';
    const path = resolved.startsWith('/') ? resolved : `/${resolved}`;
    return `${BACKEND_BASE_URL}${path}`;
  }, [resolved, privateImageId]);

  const [currentSrc, setCurrentSrc] = useState(privateImageId ? '' : resolved);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    setAttempt(0);
    setShowPlaceholder(false);
    setCurrentSrc(privateImageId ? '' : resolved);

    if (privateImageId) {
      closetService.getItemImage(privateImageId)
        .then((response) => {
          objectUrl = URL.createObjectURL(response.data);
          if (active) {
            setCurrentSrc(objectUrl);
          } else {
            URL.revokeObjectURL(objectUrl);
          }
        })
        .catch(() => {
          if (active) setShowPlaceholder(true);
        });
    }

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);  // Re-run whenever the raw src prop changes

  const handleError = (e) => {
    if (attempt === 0 && backendFallback && backendFallback !== currentSrc) {
      setAttempt(1);
      setCurrentSrc(backendFallback);
      return;
    }
    setShowPlaceholder(true);
  };

  const handleLoad = () => {
    setShowPlaceholder(false);
  };

  if (!resolved && !outfit) {
    return (
      <div className={`${className} ${wrapperClassName}`} style={style}>
        <Placeholder outfit={{ id: 'unknown' }} alt={alt} />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden w-full h-full ${wrapperClassName} ${className}`} style={style}>
      {!showPlaceholder && currentSrc && (
        <img
          src={currentSrc}
          alt={alt || outfit?.name || ''}
          onError={handleError}
          onLoad={handleLoad}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover ${imgClassName}`}
        />
      )}
      {(showPlaceholder || (!currentSrc)) && (
        <Placeholder outfit={outfit} alt={alt} />
      )}
    </div>
  );
};

export default SmartImage;
