import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-8 border-t border-[#2E5440]/10 bg-[#FAF7F2]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#2D2D2D]/60 font-sans">
        <div>
          Keep Them Home — Solutions Today. More Tomorrows Together.
        </div>
        <div>
          &copy; {new Date().getFullYear()} Keep Them Home. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
