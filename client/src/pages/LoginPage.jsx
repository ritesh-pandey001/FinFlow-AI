import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineArrowRight } from 'react-icons/hi';
import { AppContext } from '../App';
import BrandMark from '../components/BrandMark';

export default function LoginPage() {
  const { setIsAuthenticated, setProfile } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buildDisplayName = (value) => {
    const localPart = value.split('@')[0] || 'workspace user';
    return localPart
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim() || 'Workspace user';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setProfile({
      name: buildDisplayName(email),
      title: 'Workspace member',
      email,
      workspace: 'FinFlow AI — Enterprise',
    });
    setLoading(false);
    setIsAuthenticated(true);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.06),transparent_26%)]" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:96px_96px]" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/8 bg-slate-950/75 shadow-[0_30px_100px_-45px_rgba(2,6,23,0.95)] backdrop-blur-2xl lg:grid-cols-[1.15fr_0.85fr]"
      >
        <div className="flex flex-col justify-between border-b border-white/8 p-8 sm:p-10 lg:border-b-0 lg:border-r">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <BrandMark size={44} compact />
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/35">FinFlow AI</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-white">Enterprise receivables workspace</h1>
              </div>
            </div>
            <div className="max-w-lg space-y-4">
              <p className="text-sm leading-6 text-white/45">A focused workspace for invoice follow-up, analytics, audit history, and AI-assisted collections.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  'Persisted workspace state',
                  'AI follow-up workflow',
                  'Audit-ready logging',
                  'Clean enterprise dashboard',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/75">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-200" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 rounded-[1.75rem] border border-white/8 bg-white/[0.02] p-5 sm:grid-cols-3">
              {[
                ['Receivables view', 'Live'],
                ['Email engine', 'Controlled'],
                ['Audit posture', 'Monitored'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/28">{label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ['Realtime queue', 'Live'],
              ['Audit trail', 'Verified'],
              ['AI output', 'Controlled'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">{label}</p>
                <p className="mt-2 text-lg font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mb-8">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-200">Secure sign in</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-white/45">Use any credentials in demo mode to enter the dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-white/35">Email</span>
              <div className="relative">
                <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-white/8 bg-white/[0.03] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/25 focus:bg-white/[0.04]"
                  placeholder="admin@finflow.ai"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-white/35">Password</span>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-white/8 bg-white/[0.03] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/25 focus:bg-white/[0.04]"
                  placeholder="••••••••"
                />
              </div>
            </label>

            {error && <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              {loading ? 'Authenticating...' : 'Enter workspace'}
              {!loading && <HiOutlineArrowRight size={16} />}
            </button>

            <div className="grid gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-xs text-white/40 sm:grid-cols-2">
              <div>
                <p className="font-semibold text-white/70">Workspace ready</p>
                <p className="mt-1 leading-5">Data persistence and demo seed content are enabled on first load.</p>
              </div>
              <div>
                <p className="font-semibold text-white/70">Enterprise flow</p>
                <p className="mt-1 leading-5">Invoice ingestion, audit logs, and AI emails stay available after refresh.</p>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
