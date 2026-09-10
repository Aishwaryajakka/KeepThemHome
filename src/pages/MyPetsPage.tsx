import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useAppAuth } from '@/auth/AuthProvider';
import { caseApi, type SavedCaseSummary } from '@/lib/case-api';
import { persistAssessmentCase } from '@/lib/assessment-session';
import { restorePersistedCase } from '@/lib/persisted-case';

const barrierLabel = (value: string) => ({ housing: 'Housing', behavior: 'Behavior', cost: 'Money', medical: 'Veterinary care', temporary_crisis: 'Temporary crisis', time_capacity: 'Time / capacity', circumstances: 'Family / life change' })[value as 'housing'] ?? value;
const outcomeLabel = (value: string) => ({ keeping: 'Keeping pet', still_trying: 'Still trying', rehoming_help: 'Rehoming help needed' })[value as 'keeping'] ?? 'Plan created';

export default function MyPetsPage() {
  const auth = useAppAuth();
  const navigate = useNavigate();
  const [savedCases, setSavedCases] = useState<SavedCaseSummary[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!auth.loaded) return;
    if (!auth.signedIn) { setStatus('ready'); return; }
    void caseApi.listCases().then((cases) => { setSavedCases(cases); setStatus('ready'); }).catch(() => setStatus('error'));
  }, [auth.loaded, auth.signedIn]);

  const continueCase = async (caseId: string) => {
    try {
      const saved = await caseApi.getCase(caseId);
      const restored = restorePersistedCase(saved);
      if (!restored) throw new Error('Invalid saved case');
      persistAssessmentCase(restored);
      navigate('/');
    } catch { setStatus('error'); }
  };

  return <div className="min-h-screen bg-[#FAF7F2]"><Header /><main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
    <h1 className="font-serif text-4xl text-[#2E5440]">My Pets</h1>
    {!auth.configured && <p className="mt-4 text-[#2D2D2D]/75">Clerk is not configured locally. Add the required environment keys to use saved pets.</p>}
    {auth.configured && !auth.signedIn && <div className="mt-6"><p className="mb-4 text-[#2D2D2D]/75">Sign in to see your saved pets.</p><Button onClick={auth.openSignIn} className="bg-[#2E5440] text-[#FAF7F2]">Sign in</Button></div>}
    {auth.signedIn && status === 'loading' && <p className="mt-6" role="status">Loading your pets…</p>}
    {auth.signedIn && status === 'error' && <p className="mt-6 text-[#7A3028]" role="alert">We couldn’t load your saved pets. Please try again.</p>}
    {auth.signedIn && status === 'ready' && savedCases.length === 0 && <div className="mt-8"><p>You haven’t saved a pet yet.</p><Button className="mt-4 bg-[#2E5440] text-[#FAF7F2]" onClick={() => navigate('/')}>Start an assessment</Button></div>}
    {auth.signedIn && savedCases.length > 0 && <div className="mt-8 grid gap-5">
      {savedCases.map((item) => {
        const contributors = item.factors.filter(({ factorType, factorValue }) => (factorType.startsWith('contributing_') || factorType === 'behavior_contributor') && factorValue).map(({ factorValue }) => barrierLabel(factorValue!));
        return <article key={item.case.id} className="rounded-2xl border border-[#A7B89F]/45 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-2xl text-[#2E5440]">{item.pet.name}</h2><p className="mt-1 capitalize text-[#2D2D2D]/70">{item.pet.type}</p>
          <dl className="mt-4 grid gap-2 text-sm"><div><dt className="font-semibold text-[#2E5440]">Primary issue</dt><dd>{barrierLabel(item.case.primaryBarrier ?? 'Not specified')}</dd></div>
          {contributors.length > 0 && <div><dt className="font-semibold text-[#2E5440]">Also affecting</dt><dd>{contributors.join(', ')}</dd></div>}
          {item.case.goal && <div><dt className="font-semibold text-[#2E5440]">Goal</dt><dd>{item.case.goal}</dd></div>}
          {item.case.urgency && <div><dt className="font-semibold text-[#2E5440]">Urgency</dt><dd>{item.case.urgency}</dd></div>}
          <div><dt className="font-semibold text-[#2E5440]">Status</dt><dd>{item.latestOutcome ? outcomeLabel(item.latestOutcome.status) : 'Plan created'}</dd></div>
          <div><dt className="font-semibold text-[#2E5440]">Last updated</dt><dd>{new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(item.case.updatedAt))}</dd></div></dl>
          <Button className="mt-5 bg-[#2E5440] text-[#FAF7F2]" onClick={() => void continueCase(item.case.id)}>Continue {item.pet.name}’s case</Button>
        </article>;
      })}
      <Button variant="outline" className="justify-self-start border-[#2E5440] text-[#2E5440]" onClick={() => navigate('/')}>Start another pet</Button>
    </div>}
  </main><Footer /></div>;
}
