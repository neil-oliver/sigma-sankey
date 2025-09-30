import React from 'react';

interface SankeyFlowIconProps {
  className?: string;
  size?: number;
}

// Simplified Sankey flow icon for smaller spaces
const SankeyFlowIcon: React.FC<SankeyFlowIconProps> = ({ className = "", size = 16 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 16 16" 
      fill="none" 
      className={className}
    >
      {/* Left nodes */}
      <rect x="1" y="3" width="2" height="3" rx="0.5" fill="currentColor" />
      <rect x="1" y="8" width="2" height="5" rx="0.5" fill="currentColor" />
      
      {/* Right nodes */}
      <rect x="13" y="2" width="2" height="4" rx="0.5" fill="currentColor" />
      <rect x="13" y="8" width="2" height="6" rx="0.5" fill="currentColor" />
      
      {/* Sankey flows */}
      <path
        d="M3 4.5 C 7 4.5, 9 4, 13 4"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M3 10.5 C 7 10.5, 9 11, 13 11"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
};

export default SankeyFlowIcon;
