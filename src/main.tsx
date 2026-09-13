import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import "./index.css";
import { AuthProvider } from './auth/AuthProvider';
import { DemoModeProvider } from './demo/DemoModeProvider';

Sentry.init({
  dsn: import.meta.env['VITE_SENTRY_DSN'] as string | undefined,
  environment: import.meta.env.MODE,
});

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={<main className="min-h-screen bg-[#FAF7F2] px-6 py-20 text-center" role="alert"><h1 className="font-serif text-3xl text-[#2E5440]">We couldn’t display this page.</h1><p className="mt-3 text-[#2D2D2D]/70">Return home and try again.</p><a href="/" className="mt-6 inline-block rounded-full bg-[#2E5440] px-5 py-3 font-semibold text-white">Return to Keep Them Home</a></main>}>
    <AppWrapper>
      <AuthProvider><DemoModeProvider><App /></DemoModeProvider></AuthProvider>
    </AppWrapper>
  </Sentry.ErrorBoundary>
);
