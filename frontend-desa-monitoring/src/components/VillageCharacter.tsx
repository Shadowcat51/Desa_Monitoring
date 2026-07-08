import { useState, useEffect } from 'react';

interface VillageCharacterProps {
  mouseX: number; // normalized -1 to 1
  mouseY: number; // normalized -1 to 1
  status: 'idle' | 'greeting' | 'error';
}

export default function VillageCharacter({ mouseX, mouseY, status }: VillageCharacterProps) {
  // Head movement limits (disabled per user request)
  const headX = 0;
  const headY = 0;

  // Eye movement limits
  const eyeX = mouseX * 5;
  const eyeY = mouseY * 5;

  return (
    <div className="w-full h-full relative flex items-center justify-center p-4">
      <style>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(45deg); }
          75% { transform: rotate(-25deg); }
        }
        .animate-wave {
          animation: wave 1.2s ease-in-out infinite;
          transform-origin: 145px 135px;
        }
        .transition-transform-fast {
          transition: transform 0.15s ease-out;
        }
      `}</style>
      
      <svg viewBox="0 0 200 200" className="w-full h-full max-w-[280px] drop-shadow-2xl overflow-visible">
        
        {/* Shadow under character */}
        <ellipse cx="100" cy="200" rx="60" ry="10" fill="rgba(0,0,0,0.15)" />

        {/* Body (Static Base) */}
        <path 
          d="M 50 140 Q 100 120 150 140 L 160 210 L 40 210 Z" 
          fill="#1E40AF" 
          className="transition-all duration-300"
        />
        
        {/* Sarung (lower body pattern) */}
        <path 
          d="M 40 210 L 160 210 L 155 240 L 45 240 Z" 
          fill="#991B1B" 
        />
        <path d="M 45 220 L 158 220 M 44 230 L 156 230" stroke="#FCA5A5" strokeWidth="2" opacity="0.5" />

        {/* Left Arm (Normal) */}
        {status !== 'error' && (
          <g>
            <path 
              d="M 55 135 Q 25 170 35 210" 
              fill="none" 
              stroke="#1e3a8a" 
              strokeWidth="22" 
              strokeLinecap="round" 
            />
            {/* Hand */}
            <circle cx="35" cy="210" r="11" fill="#FCD34D" />
          </g>
        )}

        {/* Right Arm (Waving or Normal) */}
        {status !== 'error' && (
          <g className={status === 'greeting' ? 'animate-wave' : 'transition-transform duration-300'} style={{ transformOrigin: '145px 135px' }}>
            {status === 'greeting' ? (
              // Waving Arm up
              <>
                <path 
                  d="M 145 135 Q 185 110 180 70" 
                  fill="none" 
                  stroke="#1e3a8a" 
                  strokeWidth="22" 
                  strokeLinecap="round" 
                />
                <circle cx="180" cy="70" r="12" fill="#FCD34D" />
              </>
            ) : (
              // Normal Arm down
              <>
                <path 
                  d="M 145 135 Q 175 170 165 210" 
                  fill="none" 
                  stroke="#1e3a8a" 
                  strokeWidth="22" 
                  strokeLinecap="round" 
                />
                <circle cx="165" cy="210" r="11" fill="#FCD34D" />
              </>
            )}
          </g>
        )}

        {/* Crossed Arms (Error Status) */}
        {status === 'error' && (
          <g className="transition-all duration-300 transform translate-y-2">
            {/* Left arm crossed */}
            <path 
              d="M 50 140 Q 100 180 130 155" 
              fill="none" 
              stroke="#1e3a8a" 
              strokeWidth="24" 
              strokeLinecap="round" 
            />
            <circle cx="130" cy="155" r="11" fill="#FCD34D" />
            
            {/* Right arm crossed over */}
            <path 
              d="M 150 140 Q 100 190 70 160" 
              fill="none" 
              stroke="#172554" 
              strokeWidth="24" 
              strokeLinecap="round" 
            />
            <circle cx="70" cy="160" r="11" fill="#FCD34D" />
          </g>
        )}

        {/* Head Group (Moves with mouse) */}
        <g transform={`translate(${headX}, ${headY})`} className="transition-transform-fast">
          {/* Neck */}
          <rect x="90" y="110" width="20" height="30" fill="#FBBF24" />

          {/* Face Base */}
          <circle cx="100" cy="95" r="35" fill="#FCD34D" />
          
          {/* Blush */}
          <circle cx="75" cy="105" r="7" fill="#F87171" opacity="0.4" />
          <circle cx="125" cy="105" r="7" fill="#F87171" opacity="0.4" />

          {/* Eyes Base (Whites) */}
          {status === 'error' ? (
            // Error Eyes (Closed tightly or crosses)
            <g>
              <path d="M 75 90 L 85 96 L 75 102" fill="none" stroke="#475569" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 125 90 L 115 96 L 125 102" fill="none" stroke="#475569" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ) : (
            <g>
              {/* Left Eye */}
              <circle cx="82" cy="92" r="12" fill="white" />
              {/* Right Eye */}
              <circle cx="118" cy="92" r="12" fill="white" />
              
              {/* Pupils */}
              <circle cx={82 + eyeX} cy={92 + eyeY} r="5.5" fill="#0F172A" />
              <circle cx={118 + eyeX} cy={92 + eyeY} r="5.5" fill="#0F172A" />
              
              {/* Eye Catchlights (sparkle) */}
              <circle cx={80 + eyeX} cy={90 + eyeY} r="2" fill="white" />
              <circle cx={116 + eyeX} cy={90 + eyeY} r="2" fill="white" />
            </g>
          )}

          {/* Eyebrows */}
          {status === 'error' ? (
            <g>
              <path d="M 75 82 Q 82 78 88 85" fill="none" stroke="#451A03" strokeWidth="3" strokeLinecap="round" />
              <path d="M 125 82 Q 118 78 112 85" fill="none" stroke="#451A03" strokeWidth="3" strokeLinecap="round" />
            </g>
          ) : (
            <g>
              <path d="M 75 80 Q 82 75 88 80" fill="none" stroke="#451A03" strokeWidth="3" strokeLinecap="round" />
              <path d="M 125 80 Q 118 75 112 80" fill="none" stroke="#451A03" strokeWidth="3" strokeLinecap="round" />
            </g>
          )}

          {/* Mouth */}
          {status === 'error' ? (
            // Frown / Sad mouth
            <path d="M 90 118 Q 100 110 110 118" fill="none" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
          ) : status === 'greeting' ? (
            // Big open smile
            <path d="M 86 108 Q 100 128 114 108" fill="#78350F" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
          ) : (
            // Normal smile
            <path d="M 90 114 Q 100 120 110 114" fill="none" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
          )}

          {/* Caping (Traditional Hat) */}
          <path 
            d="M 15 65 Q 100 0 185 65 Q 100 78 15 65 Z" 
            fill="#D97706" 
          />
          {/* Hat Bottom Rim */}
          <path 
            d="M 15 65 Q 100 78 185 65 Q 100 86 15 65 Z" 
            fill="#B45309"
          />
          {/* Hat texture/lines */}
          <g opacity="0.4" stroke="#92400E" strokeWidth="2" strokeLinecap="round">
            <path d="M 100 15 L 85 70" />
            <path d="M 100 15 L 115 70" />
            <path d="M 100 15 L 65 67" />
            <path d="M 100 15 L 135 67" />
            <path d="M 100 15 L 45 61" />
            <path d="M 100 15 L 155 61" />
          </g>
        </g>
      </svg>
    </div>
  );
}
