import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { Home, Users, Calendar, ArrowRightLeft, Trophy, Activity, Settings } from 'lucide-react';

import SettingsPage from './pages/Settings';
import MyTeam from './pages/MyTeam';
import Fixtures from './pages/Fixtures';
import Players from './pages/Players';
import Transfers from './pages/Transfers';
import MiniLeague from './pages/MiniLeague';
import Live from './pages/Live';

function App() {
  const navItems = [
    { to: '/', label: 'My Team', icon: Home },
    { to: '/players', label: 'Players', icon: Users },
    { to: '/fixtures', label: 'Fixtures', icon: Calendar },
    { to: '/transfers', label: 'Transfers', icon: ArrowRightLeft },
    { to: '/leagues', label: 'Mini League', icon: Trophy },
    { to: '/live', label: 'Live', icon: Activity },
  ];

  return (
    <div className="flex h-dvh bg-bg-dark text-text-primary overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-fpl-purple flex flex-col hidden md:flex shrink-0">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-fpl-green flex items-center justify-center">
              <Activity className="w-5 h-5 text-fpl-purple" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">FPL Intel</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-white/10 text-fpl-green' 
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 mt-auto">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-white/10 text-fpl-green' 
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Settings className="w-5 h-5" />
            Settings
          </NavLink>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-bg-dark">
        <div className="max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<MyTeam />} />
            <Route path="/players" element={<Players />} />
            <Route path="/fixtures" element={<Fixtures />} />
            <Route path="/transfers" element={<Transfers />} />
            <Route path="/leagues" element={<MiniLeague />} />
            <Route path="/live" element={<Live />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
      
      {/* Mobile Navigation (Bottom Bar) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-fpl-purple border-t border-white/10 flex justify-around p-2 pb-[env(safe-area-inset-bottom)] z-50">
         {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center p-2 rounded-lg text-xs font-medium ${
                  isActive 
                    ? 'text-fpl-green' 
                    : 'text-gray-400'
                }`
              }
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="truncate max-w-[4rem]">{item.label}</span>
            </NavLink>
          ))}
      </nav>
    </div>
  );
}

export default App;
