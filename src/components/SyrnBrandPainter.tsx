import React from 'react';

interface SyrnBrandPainterProps {
  size?: number;
  simplified?: boolean;
}

export const SyrnBrandPainter: React.FC<SyrnBrandPainterProps> = ({ size = 120, simplified = false }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="syrn-brand-svg"
    >
      <defs>
        <linearGradient id="syrn-rose-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD6E0" />
          <stop offset="100%" stopColor="#F4A7B9" />
        </linearGradient>
        <linearGradient id="syrn-lilac-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8C8F0" />
          <stop offset="100%" stopColor="#C9A0DC" />
        </linearGradient>
        <linearGradient id="syrn-peach-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE8DC" />
          <stop offset="100%" stopColor="#FFD4C4" />
        </linearGradient>
      </defs>

      <circle cx="60" cy="60" r="42" fill="url(#syrn-peach-grad)" />

      <circle
        cx="60"
        cy="60"
        r="33"
        stroke="url(#syrn-lilac-grad)"
        strokeWidth={simplified ? 12 : 9.6}
        fill="none"
      />

      <circle
        cx="72"
        cy="54"
        r={simplified ? 15 : 16.8}
        fill="url(#syrn-rose-grad)"
      />

      {!simplified && (
        <path
          d="M 39 72 C 54 93, 72 84, 87 63 Z"
          fill="#FFB7C5"
        />
      )}
    </svg>
  );
};

export default SyrnBrandPainter;
