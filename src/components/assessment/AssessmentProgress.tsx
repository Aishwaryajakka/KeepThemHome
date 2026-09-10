import React from 'react';

interface AssessmentProgressProps {
  currentStep: number;
  totalSteps: number;
  label: string;
}

export const AssessmentProgress: React.FC<AssessmentProgressProps> = ({
  currentStep,
  totalSteps,
  label,
}) => {
  return (
    <div className="mb-6 space-y-2">
      <div className="flex items-center justify-between text-xs sm:text-sm font-semibold tracking-widest uppercase text-[#2E5440] font-sans">
        <span>{label}</span>
        <span className="text-[#2D2D2D]/50 font-normal">
          {currentStep} of {totalSteps}
        </span>
      </div>
      {/* Subtle Progress Bar */}
      <div className="w-full h-1.5 bg-[#A7B89F]/25 rounded-full overflow-hidden flex gap-1">
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const stepNum = idx + 1;
          const isComplete = stepNum <= currentStep;
          return (
            <div
              key={idx}
              className={`h-full flex-1 rounded-full transition-all duration-300 ${
                isComplete ? 'bg-[#2E5440]' : 'bg-transparent'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default AssessmentProgress;
