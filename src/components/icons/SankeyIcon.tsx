import React from 'react';

interface SankeyIconProps {
  className?: string;
  size?: number;
}

const SankeyIcon: React.FC<SankeyIconProps> = ({ className = "", size = 24 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
    >
      {/* Left nodes */}
      <rect x="2" y="4" width="3" height="4" rx="1" fill="currentColor" />
      <rect x="2" y="12" width="3" height="8" rx="1" fill="currentColor" />
      
      {/* Right nodes */}
      <rect x="19" y="2" width="3" height="6" rx="1" fill="currentColor" />
      <rect x="19" y="10" width="3" height="3" rx="1" fill="currentColor" />
      <rect x="19" y="15" width="3" height="7" rx="1" fill="currentColor" />
      
      {/* Sankey flows - curved paths */}
      <path
        d="M5 6 C 10 6, 14 5, 19 5"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M5 7 C 10 8, 14 11, 19 11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M5 16 C 10 15, 14 6, 19 6"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M5 18 C 10 18, 14 18, 19 18.5"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M5 19 C 10 19, 14 20, 19 20"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
};

export default SankeyIcon;
