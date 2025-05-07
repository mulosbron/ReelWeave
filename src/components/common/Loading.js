import React from 'react';

/**
 * Yükleniyor animasyonu gösteren bileşen
 * @param {Object} props Bileşen özellikleri
 * @param {string} [props.size='medium'] Boyut - 'small', 'medium', 'large'
 * @param {string} [props.color='currentColor'] Renk - CSS renk değeri
 * @returns {JSX.Element} Loading bileşeni
 */
const Loading = ({ size = 'medium', color = 'currentColor' }) => {
  // Boyuta göre boyutları belirle
  const sizeMap = {
    small: { width: '16px', height: '16px', borderWidth: '2px' },
    medium: { width: '24px', height: '24px', borderWidth: '3px' },
    large: { width: '36px', height: '36px', borderWidth: '4px' }
  };

  const { width, height, borderWidth } = sizeMap[size] || sizeMap.medium;

  // Temel stil
  const style = {
    width,
    height,
    border: `${borderWidth} solid rgba(0, 0, 0, 0.1)`,
    borderTopColor: color,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    display: 'inline-block'
  };

  return (
    <>
      <style>
        {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        `}
      </style>
      <div style={style} role="status" aria-label="Yükleniyor"></div>
    </>
  );
};

export default Loading;