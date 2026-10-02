import { Link, NavLink, Outlet } from "react-router-dom";
import { Search } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Home", end: true },
  { to: "/visualizer", label: "Visualizer", end: false },
  { to: "/dsa", label: "DSA Dashboard", end: false },
  { to: "/statistics", label: "Statistics", end: false },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <Search className="h-6 w-6 text-indigo-600" />
            Mini Search Engine
          </Link>
          <nav className="flex flex-wrap gap-1 text-sm">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 font-medium ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        Built with a Trie, an Inverted Index (HashMap), Ranking and Merge Sort
      </footer>
    </div>
  );
}