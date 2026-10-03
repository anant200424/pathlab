'use client';

import React from 'react';

interface DoctorSignatureProps {
  doctorName?: string;
  className?: string;
}

export function DoctorSignature({ doctorName = 'DR N UPADHYAY', className = '' }: DoctorSignatureProps) {
  // Extract a signature script label, e.g. "Nishant Upadhyay" or initials
  const displayName = doctorName.replace(/^dr\.?\s+/i, '').trim();

  return (
    <div className={`inline-block relative select-none ${className}`}>
      <svg
        viewBox="0 0 200 65"
        className="w-36 h-14 overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Natural cursive signature script text */}
        <text
          x="15"
          y="35"
          fontFamily="'Brush Script MT', 'Dancing Script', 'Caveat', 'Segoe Script', cursive"
          fontSize="26"
          fontWeight="bold"
          fill="#1e293b"
          style={{ letterSpacing: '0.05em' }}
        >
          {displayName.length > 18 ? displayName.split(' ')[0] : displayName}
        </text>

        {/* Flourish underline curve mimicking pen stroke */}
        <path
          d="M 12,42 Q 70,52 140,38 T 185,46"
          stroke="#1e293b"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="transparent"
        />
        {/* Quick accent loop */}
        <path
          d="M 155,42 Q 170,30 162,24 Q 150,20 158,35 Q 166,45 188,48"
          stroke="#1e293b"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
    </div>
  );
}
