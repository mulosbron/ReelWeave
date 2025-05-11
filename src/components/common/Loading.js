import React from 'react';

/**
 * Component that shows loading animation
 * @param {Object} props Component properties
 * @param {string} [props.size='medium'] Size - 'small', 'medium', 'large'
 * @param {string} [props.color='currentColor'] Color - CSS color value
 * @returns {JSX.Element} Loading component
 */
const Loading = ({ size = 'medium', color = 'currentColor' }) => {
  // Determine dimensions based on size
  const sizeMap = {
    small: { width: '16px', height: '16px', borderWidth: '2px' },
    medium: { width: '24px', height: '24px', borderWidth: '3px' },
    large: { width: '36px', height: '36px', borderWidth: '4px' }
  };

  const { width, height, borderWidth } = sizeMap[size] || sizeMap.medium;

  // Base style
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
      <div style={style} role="status" aria-label="Loading"></div>
    </>
  );
};

export default Loading;