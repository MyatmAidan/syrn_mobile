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
    >
      {/* Base Circle (pollen) */}
      <circle cx="60" cy="60" r="42" fill="#F0C283" />

      {/* Soft Accent Ring (ballerina) */}
      <circle
        cx="60"
        cy="60"
        r="33"
        stroke="#DCA7A1"
        strokeWidth={simplified ? 12 : 9.6}
        fill="none"
      />

      {/* Overlapping Small Circle (lovePotion) */}
      <circle
        cx="72"
        cy="54"
        r={simplified ? 15 : 16.8}
        fill="#CF6E6C"
      />

      {/* Elegant Leaf/Tear Shape (ballerina) - only in full version */}
      {!simplified && (
        <path
          d="M 39 72 C 54 93, 72 84, 87 63 Z"
          fill="#DCA7A1"
        />
      )}
    </svg>
  );
};

export default SyrnBrandPainter;
