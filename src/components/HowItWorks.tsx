import React from 'react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: "Tell us what’s happening",
      description: "Share what is making it difficult to keep your pet.",
    },
    {
      number: '02',
      title: "Explore possible solutions",
      description: "We’ll help organize the situation and identify options worth exploring.",
    },
    {
      number: '03',
      title: "Make a plan",
      description: "Leave with clear next steps and resources to consider.",
    },
  ];

  return (
    <section className="py-14 sm:py-20 md:py-24 border-t border-[#2E5440]/10 bg-[#FAF7F2]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Section Title */}
        <div className="mb-10 sm:mb-14">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#2E5440] font-normal tracking-tight">
            How it works
          </h2>
        </div>

        {/* 3 Step Cards: Sophisticated, clean, un-crowded */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex flex-col p-6 sm:p-7 rounded-xl bg-white/70 border border-[#A7B89F]/30 shadow-[0_2px_8px_rgba(46,84,64,0.03)] hover:border-[#A7B89F]/60 transition-colors"
            >
              {/* Step Number Badge */}
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-[#FAF7F2] border border-[#E3C9B2]/80 text-[#2E5440] font-sans font-semibold text-sm mb-5">
                {step.number}
              </div>

              {/* Step Title */}
              <h3 className="font-serif text-lg sm:text-xl text-[#2E5440] font-medium mb-2.5 leading-snug">
                {step.title}
              </h3>

              {/* Step Description */}
              <p className="font-sans text-sm sm:text-base text-[#2D2D2D]/75 leading-relaxed text-pretty mt-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
