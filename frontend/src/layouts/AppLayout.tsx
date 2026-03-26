import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

import { labels } from "../lib/i18n-he";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="font-semibold tracking-tight">
            {labels.appTitle}
          </div>
          <nav className="flex gap-4 text-sm text-slate-700">
            <NavLink
              to="/students"
              active={location.pathname.startsWith("/students")}
            >
              {labels.nav.students}
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}

type NavLinkProps = {
  to: string;
  active: boolean;
  children: ReactNode;
};

function NavLink({ to, active, children }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={
        active
          ? "text-emerald-700 font-medium"
          : "text-slate-600 hover:text-slate-900"
      }
    >
      {children}
    </Link>
  );
}
