import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileText,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { responsibleRehomingResources } from '@/data/resources';

interface ResponsibleRehomingProps {
  petName: string;
  onReturnToPlan: () => void;
  onStartAnotherCase: () => void;
  onBack: () => void;
}

export const ResponsibleRehoming: React.FC<ResponsibleRehomingProps> = ({
  petName,
  onReturnToPlan,
  onStartAnotherCase,
  onBack,
}) => {
  const displayName = petName.trim() || 'your pet';
  const [showSupportModal, setShowSupportModal] = useState(false);

  const guidanceSteps = [
    {
      step: 'STEP 01',
      badge: 'PREPARE',
      title: 'Create an accurate pet profile',
      description: `Gather clear information about ${displayName}’s health, behavior, routine, preferences, medications, and history.`,
      note: 'Being transparent helps potential caregivers understand whether they’re a good fit.',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      step: 'STEP 02',
      badge: 'START CLOSE TO HOME',
      title: 'Reach out to people and organizations you trust',
      description:
        'Consider trusted friends, family, veterinary contacts, rescues, or other reputable animal-welfare organizations before using an unknown placement.',
      note: 'A trusted connection may provide more context and accountability during the transition.',
      icon: <Users className="w-5 h-5" />,
    },
    {
      step: 'STEP 03',
      badge: 'PLACE CAREFULLY',
      title: 'Screen potential homes',
      description:
        'Ask thoughtful questions about the potential home, household members, other animals, experience, expectations, and long-term plans.',
      note: 'Finding the right fit matters more than finding the fastest placement.',
      icon: <Search className="w-5 h-5" />,
    },
    {
      step: 'STEP 04',
      badge: 'TRANSITION SAFELY',
      title: 'Prepare for the transition',
      description: `When possible, send relevant veterinary records, medication information, feeding instructions, routines, and familiar belongings with ${displayName}.`,
      note: 'Continuity can make a major change easier for both the pet and the new caregiver.',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
  ];

  return (
    <div className="py-8 sm:py-14 md:py-20 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto w-full">
      {/* Top Back navigation */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#2D2D2D]/60 hover:text-[#2E5440] font-medium mb-8 sm:mb-10 transition-colors cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5440] rounded px-1 -ml-1"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Back to outcome options</span>
      </button>

      {/* Page Introduction */}
      <div className="mb-10 sm:mb-12">
        <span className="text-xs font-semibold tracking-widest uppercase text-[#2E5440] mb-2 block font-sans">
          RESPONSIBLE REHOMING
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2E5440] font-normal leading-tight tracking-tight mb-3 sm:mb-4 text-balance">
          Let’s find the safest next step for {displayName}.
        </h1>
        <p className="font-sans text-base sm:text-lg text-[#2D2D2D]/85 leading-relaxed text-pretty max-w-2xl mb-4">
          If keeping {displayName} isn’t realistically possible, preparing carefully can help make the transition safer and less stressful.
        </p>

        {/* Contextual message acknowledging previous effort */}
        <div className="p-4 sm:p-5 rounded-xl bg-white/70 border border-[#A7B89F]/40 text-sm text-[#2D2D2D]/80 leading-relaxed max-w-2xl">
          <p className="text-pretty">
            You’ve already explored options for keeping {displayName} at home. Choosing another path does not erase that effort.
          </p>
        </div>
      </div>

      {/* Rehoming Guidance Cards */}
      <div className="space-y-4 sm:space-y-5 mb-10 sm:mb-14">
        {guidanceSteps.map((step) => (
          <div
            key={step.step}
            className="p-5 sm:p-7 rounded-2xl bg-white/85 border border-[#A7B89F]/45 shadow-xs transition-all hover:border-[#A7B89F]/80"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#A7B89F]/40 flex items-center justify-center text-[#2E5440] shrink-0">
                  {step.icon}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-[#2D2D2D]/60 font-semibold">
                    {step.step}
                  </span>
                  <span className="text-xs font-sans font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#E3C9B2]/35 text-[#2E5440] border border-[#E3C9B2]/60">
                    {step.badge}
                  </span>
                </div>
              </div>
            </div>

            <h3 className="font-serif text-lg sm:text-xl font-normal text-[#2E5440] mb-2 leading-snug">
              {step.title}
            </h3>

            <p className="font-sans text-sm sm:text-base text-[#2D2D2D]/85 leading-relaxed mb-3 text-pretty">
              {step.description}
            </p>

            <div className="pt-2.5 border-t border-[#2E5440]/10 flex items-start gap-2 text-xs text-[#2D2D2D]/70 font-sans leading-relaxed">
              <span className="font-semibold text-[#2E5440]">Note:</span>
              <span className="text-pretty">{step.note}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Important Safety Notice */}
      <div className="mb-10 sm:mb-14 p-5 sm:p-7 rounded-2xl bg-[#FAF7F2] border border-[#E3C9B2] shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-full bg-[#E3C9B2]/50 border border-[#E3C9B2] flex items-center justify-center text-[#2E5440] shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-[#2E5440]" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-serif text-lg sm:text-xl font-normal text-[#2E5440]">
              Safety matters
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#2D2D2D]/80 leading-relaxed text-pretty">
              Be honest about known medical or behavior concerns. If {displayName} has a history of serious aggression or there is an immediate safety concern, seek guidance from a qualified veterinary or animal-behavior professional rather than attempting an informal placement.
            </p>
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="mb-12 sm:mb-16 p-6 sm:p-8 rounded-2xl bg-white/80 border border-[#A7B89F]/40 shadow-xs space-y-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#2E5440] mb-2">
            Need more support?
          </h2>
          <p className="font-sans text-sm sm:text-base text-[#2D2D2D]/80 leading-relaxed text-pretty">
            Shelters, rescues, veterinary teams, and community organizations may be able to provide guidance depending on your location and situation.
          </p>
        </div>

        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowSupportModal(true)}
            className="min-h-11 px-5 py-2.5 rounded-lg border-[#2E5440] text-[#2E5440] hover:bg-[#2E5440] hover:text-[#FAF7F2] text-sm font-medium transition-all inline-flex items-center gap-2 group cursor-pointer"
          >
            <span>Find shelter or rescue support</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

        <p className="text-xs text-[#2D2D2D]/60 italic font-sans pt-1">
          Resource availability varies by location. Always verify information directly with the organization.
        </p>
      </div>

      {/* Final Decision Area */}
      <div className="pt-6 border-t border-[#A7B89F]/30 space-y-4">
        <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#2E5440]">
          What would you like to do?
        </h2>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <Button
            type="button"
            onClick={onReturnToPlan}
            size="lg"
            className="min-h-12 px-7 py-3.5 rounded-lg bg-[#2E5440] hover:bg-[#244232] text-[#FAF7F2] text-base font-medium transition-all shadow-sm flex items-center justify-center gap-2 group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2E5440]"
          >
            <span>Return to my Keep {displayName} Home Plan</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onStartAnotherCase}
            size="lg"
            className="min-h-12 px-6 py-3.5 rounded-lg border-[#A7B89F]/60 text-[#2D2D2D] hover:bg-white hover:text-[#2E5440] text-base font-medium transition-all cursor-pointer"
          >
            Start another case
          </Button>
        </div>
      </div>

      {/* Shelter / Rescue Support Modal */}
      <Dialog open={showSupportModal} onOpenChange={setShowSupportModal}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg bg-[#FAF7F2] border-[#A7B89F]/40 p-6 sm:p-8">
          <DialogHeader className="space-y-3 text-left">
            <div className="w-10 h-10 rounded-full bg-[#E3C9B2]/40 border border-[#E3C9B2] flex items-center justify-center text-[#2E5440]">
              <Building2 className="w-5 h-5" />
            </div>
            <DialogTitle className="font-serif text-2xl text-[#2E5440] font-normal">
              Shelter & Rescue Directory
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-[#2D2D2D]/80 leading-relaxed pt-1 space-y-3">
              <span>
                These verified directories can help you look for community support. They do not guarantee local availability or placement.
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-2.5">
            {responsibleRehomingResources.map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[#A7B89F]/40 bg-white/70 text-sm text-[#2E5440] hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5440]"
              >
                <span>
                  <span className="font-medium block">{resource.name}</span>
                  <span className="text-xs text-[#2D2D2D]/60">{resource.geographicScope}</span>
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </a>
            ))}
            <p className="text-xs text-[#2D2D2D]/60 italic pt-1">
              Resource availability and eligibility can change. Verify details directly with the organization before relying on a program.
            </p>
          </div>

          <div className="mt-5 flex justify-end">
            <Button
              onClick={() => setShowSupportModal(false)}
              className="bg-[#2E5440] hover:bg-[#244232] text-[#FAF7F2] px-5 py-2 font-medium"
            >
              Understood
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResponsibleRehoming;
