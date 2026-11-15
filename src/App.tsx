import { useEffect, useState, type ReactNode } from 'react';
import { Icon, type IconName } from './components/Icons';
import { ToastProvider } from './state/toast';
import { StoreProvider, useStore } from './state/store';
import { CitizenPortal } from './pages/CitizenPortal';
import { OfficerCentre } from './pages/OfficerCentre';
import { ImpactDashboard } from './pages/ImpactDashboard';
import { ChatBot } from './components/ChatBot';

type Route = 'report' | 'officer' | 'impact';
const TABS: { route: Route; label: string; icon: IconName }[] = [
  { route: 'report', label: 'Citizen Portal', icon: 'pin' },
  { route: 'officer', label: 'Officer Command Centre', icon: 'shield' },
  { route: 'impact', label: 'City Impact', icon: 'chart' },
];

const parse = (): Route => {
  const h = window.location.hash.replace('#/', '');
  return h === 'officer' || h === 'impact' ? h : 'report';
};

function Shell() {
  const [route, setRoute] = useState<Route>(parse);
  const { officer, signOut } = useStore();

  useEffect(() => {
    const on = () => {
      setRoute(parse());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const page: Record<Route, ReactNode> = { report: <CitizenPortal />, officer: <OfficerCentre />, impact: <ImpactDashboard /> };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-navy-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <a href="#/report" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-navy-900">
              <Icon name="pin" className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-lg font-bold leading-tight tracking-tight">NammaFix AI</span>
              <span className="block text-xs text-blue-200">Bengaluru Civic Intelligence Platform</span>
            </span>
          </a>
          <nav aria-label="Main" className="order-3 flex w-full gap-1 overflow-x-auto lg:order-none lg:ml-4 lg:w-auto">
            {TABS.map((t) => (
              <a
                key={t.route}
                href={`#/${t.route}`}
                aria-current={route === t.route ? 'page' : undefined}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  route === t.route ? 'bg-white/15 text-white' : 'text-blue-100 hover:bg-white/10'
                }`}
              >
                <Icon name={t.icon} className="h-4 w-4" />
                {t.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            {officer ? (
              <>
                <span className="hidden text-right leading-tight sm:block">
                  <span className="block font-medium">{officer.name}</span>
                  <span className="block text-xs text-blue-200">{officer.title}</span>
                </span>
                <button onClick={signOut} className="btn bg-white/10 px-3 py-1.5 text-white hover:bg-white/20">
                  <Icon name="logout" className="h-4 w-4" /> Sign out
                </button>
              </>
            ) : (
              <span className="text-xs text-blue-200">Officer not signed in</span>
            )}
          </div>
        </div>
      </header>

      <div className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-900">
        <strong>Prototype:</strong> sample complaints are synthetic demonstration data, and the AI agents are rule-based simulations. No live LLM or vision model is connected.
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{page[route]}</main>

      <ChatBot />

      <footer className="border-t border-line bg-white py-4 text-center text-xs text-ink-500">
        NammaFix AI · Report Less. Resolve Smarter. Build a Better Bengaluru. · Hackathon prototype – data stays in your browser (localStorage).
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </ToastProvider>
  );
}
