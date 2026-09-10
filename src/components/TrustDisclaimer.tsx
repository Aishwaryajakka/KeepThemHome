import React from 'react';
import { Info } from 'lucide-react';

export const TrustDisclaimer: React.FC = () => {
  return (
    <section className="py-8 sm:py-10 border-t border-[#2E5440]/10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-start sm:items-center gap-3 p-4 sm:p-5 rounded-lg bg-[#FAF7F2] border border-[#A7B89F]/20 text-[#2D2D2D]/70 text-xs sm:text-sm leading-relaxed">
          <Info className="w-4 h-4 text-[#A7B89F] shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-pretty">
            Keep Them Home provides informational guidance and does not replace veterinary, legal, behavioral, or emergency services.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TrustDisclaimer;
