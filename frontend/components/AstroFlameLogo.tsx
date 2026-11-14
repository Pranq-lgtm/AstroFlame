'use client';

import React from 'react';
import Image from 'next/image';

interface AstroFlameLogoProps {
  size?: number;
  showWordmark?: boolean;
}

/**
 * Renders the AstroFlame orbital flame emblem (/assets/brand/astroflame-logo.jpg)
 * with a tight rounded-square crop (`scale-[1.24]`) that preserves the cyan orbital 'A'
 * and inner microgravity flame.
 */
export default function AstroFlameLogo({
  size = 38,
  showWordmark = true,
}: AstroFlameLogoProps) {
  return (
    <div className="inline-flex items-center gap-2.5 select-none shrink-0">
      <div
        style={{ width: size, height: size }}
        className="relative rounded-xl overflow-hidden border border-sky-500/50 bg-[#050814] shadow-sm shrink-0"
      >
        <Image
          src="/assets/brand/astroflame-logo.jpg"
          alt="AstroFlame Emblem"
          fill
          sizes={`${size}px`}
          referrerPolicy="no-referrer"
          className="object-cover object-center scale-[1.24]"
        />
      </div>
      {showWordmark && (
        <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-sky-300 to-cyan-400 bg-clip-text text-transparent">
          AstroFlame
        </span>
      )}
    </div>
  );
}
