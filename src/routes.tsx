import HomePage from './pages/HomePage';
import type { ReactNode } from 'react';
import MyPetsPage from './pages/MyPetsPage';

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
  { name: 'My Pets', path: '/my-pets', element: <MyPetsPage /> },
];
