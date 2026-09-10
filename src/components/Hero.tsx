import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroProps {
  onStart: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStart }) => {
  return (
    <section className="relative pt-8 pb-16 sm:pt-14 sm:pb-20 md:pt-20 md:pb-28 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 text-center sm:text-left">
        {/* Subtle Compassion Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E3C9B2]/30 border border-[#E3C9B2]/60 text-[#2E5440] text-xs sm:text-sm font-medium mb-6 animate-fade-in">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2E5440]" />
          <span>Support before surrender</span>
        </div>

        {/* Dominant Visual Headline */}
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.75rem] text-[#2E5440] font-normal leading-[1.18] md:leading-[1.15] tracking-tight mb-6 sm:mb-7 max-w-4xl text-balance">
          Before you give them up,<br className="hidden sm:inline" /> let’s see what’s possible.
        </h1>

        {/* Supporting Text */}
        <p className="font-sans text-base sm:text-lg md:text-xl text-[#2D2D2D]/85 font-normal leading-relaxed max-w-2xl mb-8 sm:mb-10 text-pretty">
          If keeping your pet has become difficult, we’ll help you understand your options before surrender becomes the only one.
        </p>

        {/* Primary CTA Area */}
        <div className="flex flex-col items-center sm:items-start gap-3">
          <Button
            onClick={onStart}
            size="lg"
            className="w-full sm:w-auto min-h-12 px-7 py-3.5 rounded-lg bg-[#2E5440] hover:bg-[#244232] text-[#FAF7F2] text-base font-medium transition-all shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-center gap-2 group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2E5440] focus-visible:ring-offset-2"
          >
            <span>Find options for my pet</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>

          {/* Subtext under CTA */}
          <p className="text-xs sm:text-sm text-[#2D2D2D]/60 tracking-normal font-normal mt-1">
            No judgment. No account required.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
