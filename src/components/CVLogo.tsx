/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface CVLogoProps {
  className?: string;
}

export const CVLogo: React.FC<CVLogoProps> = ({ className = 'w-9 h-9' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        referrerPolicy="no-referrer"
      >
        {/* Outer Circular Ring (Blue) - Semi Arch */}
        <path
          d="M 16,32 A 40,40 0 1,0 84,32"
          stroke="#008BE2"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Upward Blue T-Arrow Head */}
        <path
          d="M 20,32 L 34,32 L 50,14 L 66,32 L 80,32 L 80,24 L 50,4 L 20,24 Z"
          fill="#008BE2"
        />
        
        {/* Vertical Blue T-Arrow Stem */}
        <rect x="46" y="24" width="8" height="54" fill="#008BE2" />

        {/* Angular Red "B" Shape */}
        <path
          d="M 38,24 H 66 L 66,46 H 48 H 66 L 66,68 H 38 V 24"
          stroke="#E31E24"
          strokeWidth="8"
          strokeLinecap="square"
          strokeLinejoin="miter"
          fill="none"
        />
      </svg>
    </div>
  );
};
