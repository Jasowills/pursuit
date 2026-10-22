'use client';
import { useEffect, useState } from 'react';
import { Icon } from './icons';
export type Platform = 'macOS' | 'Windows' | 'Linux';
export function detectPlatform(
  platform: string,
  userAgent: string,
  touchPoints = 0,
): Platform | null {
  if (/iPhone|iPad|iPod|Android/i.test(userAgent)) return null;
  if (/Mac/i.test(platform)) return touchPoints > 1 ? null : 'macOS';
  if (/Win/i.test(platform)) return 'Windows';
  if (/Linux|X11/i.test(platform)) return 'Linux';
  return null;
}
export function usePlatform() {
  const [platform, setPlatform] = useState<Platform | null>(null);
  useEffect(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    setPlatform(
      detectPlatform(
        nav.userAgentData?.platform || nav.platform,
        nav.userAgent,
        nav.maxTouchPoints,
      ),
    );
  }, []);
  return platform;
}
export function PlatformLogo({ platform, size = 20 }: { platform: Platform; size?: number }) {
  return (
    <img
      className={`platform-logo platform-logo-${platform}`}
      src={`/brands/${platform === 'macOS' ? 'apple' : platform === 'Windows' ? 'windows' : 'linux'}.svg`}
      alt=""
      width={size}
      height={size}
    />
  );
}
export function HeroDownload() {
  const platform = usePlatform();
  return (
    <div className="hero-download">
      <a
        href="#download"
        className="dark-button primary"
        aria-label={
          platform
            ? `Get Pursuit for ${platform}: alpha download options`
            : 'Get Pursuit: desktop download options'
        }
      >
        {platform ? <PlatformLogo platform={platform} /> : <Icon name="monitor" size={18} />}
        <span>{platform ? `Get Pursuit for ${platform}` : 'Get Pursuit for desktop'}</span>
        <Icon name="arrowUpRight" size={16} />
      </a>
      <span className="hero-download-caption">Source alpha · public installers coming later</span>
    </div>
  );
}
