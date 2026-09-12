import HomePage from './pages/HomePage';
import { lazy, Suspense, type ReactNode } from 'react';

const MyPetsPage = lazy(() => import('./pages/MyPetsPage'));

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  /** Accessible without login. Routes without this flag require authentication. Has no effect when RouteGuard is not in use. */
  public?: boolean;
}

export const routes: RouteConfig[] = [
  {
    name: 'Home',
    path: '/',
    element: <HomePage />,
    public: true,
  },
  { name: 'Dashboard', path: '/dashboard', element: <Suspense fallback={<div className="min-h-screen bg-[var(--cream)] p-8" role="status" aria-label="Loading dashboard" />}><MyPetsPage /></Suspense> },
  { name: 'My Pets', path: '/my-pets', element: <Suspense fallback={<div className="min-h-screen bg-[var(--cream)] p-8" role="status" aria-label="Loading pets" />}><MyPetsPage /></Suspense> },
  { name: 'Case workspace', path: '/pets/:petId/cases/:caseId', element: <HomePage /> },
];
