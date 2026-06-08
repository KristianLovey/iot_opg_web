'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });
      if (!resp.ok) {
        const { error: msg } = await resp.json();
        setError(msg || 'Greška pri prijavi.');
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setError('Nema veze s poslužiteljem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-ink-900 text-paper flex items-center justify-center relative overflow-hidden">
            <Icon.Leaf className="w-5 h-5 text-moss-300 relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-moss-700/30 to-transparent"></div>
          </div>
          <div>
            <div className="display text-[18px] leading-none text-ink-900 font-semibold">
              Plastenik<span className="text-moss-700">.io</span>
            </div>
            <div className="text-[10px] text-ink-400 tracking-wider uppercase mt-0.5">Pametni IoT nadzor</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-6">
          <h1 className="display text-2xl text-ink-900 mb-1">Prijava</h1>
          <p className="text-[13px] text-ink-500 mb-5">Prijavite se s vašim ThingsBoard korisničkim računom.</p>

          {error && (
            <div className="mb-4 flex items-center gap-2 bg-clay/10 text-clay-dark border border-clay/20 rounded-lg px-3 py-2 text-[13px]">
              <Icon.Alert className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-ink-600">E-mail</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="korisnik@opg.hr"
                className="w-full px-3 py-2 text-[13px] bg-paper-soft border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-moss-400 focus:border-moss-500 placeholder:text-ink-300"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-ink-600">Lozinka</span>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pr-9 text-[13px] bg-paper-soft border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-moss-400 focus:border-moss-500 placeholder:text-ink-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors"
                  tabIndex={-1}
                  aria-label={showPwd ? 'Sakrij lozinku' : 'Prikaži lozinku'}
                >
                  {showPwd ? <Icon.EyeOff className="w-4 h-4" /> : <Icon.Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-moss-700 hover:bg-moss-800 text-paper font-medium text-[13px] px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (
                <><Icon.Refresh className="w-4 h-4 animate-spin" /> Prijavljujem…</>
              ) : (
                <><Icon.ArrowRight className="w-4 h-4" /> Prijavi se</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-ink-400 mt-4">
          ThingsBoard CE @ 161.53.133.253:8080
        </p>
      </div>
    </div>
  );
}
