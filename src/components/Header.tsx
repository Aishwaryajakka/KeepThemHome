import React from 'react';

interface HeaderProps {
  onCtaClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onCtaClick }) => {
  return (
    <header className="w-full bg-[#FAF7F2]/90 backdrop-blur-sm sticky top-0 z-30 transition-all border-b border-[#2E5440]/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-5 flex items-center justify-between">
        {/* Official Keep Them Home Logo */}
        <div className="flex items-center">
          <a
            href="/"
            onClick={(event) => {
              if (onCtaClick) {
                event.preventDefault();
                onCtaClick();
              }
            }}
            className="flex items-center group transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5440] rounded-md p-0.5"
            aria-label="Keep Them Home Homepage"
          >
            <img
              src="/images/logo.png"
              alt="Keep Them Home"
              className="h-12 sm:h-14 md:h-16 w-auto object-contain transition-transform duration-200"
            />
          </a>
        </div>

        {/* Minimal header space - no clutter or traditional marketing nav */}
        <div className="hidden sm:flex items-center text-xs text-[#2D2D2D]/60 tracking-wider uppercase font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-[#A7B89F] mr-2" />
          Surrender Prevention Navigator
        </div>
      </div>
    </header>
  );
};

export default Header;
