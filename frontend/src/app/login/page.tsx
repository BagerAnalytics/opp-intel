'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://oppintel.up.railway.app';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${apiUrl}/api/auth/login`, {
        email,
        password
      });

      if (response.data.access_token) {
        localStorage.setItem('oppintel_token', response.data.access_token);
        localStorage.setItem('oppintel_user', JSON.stringify(response.data.user));
        
        // Trigger a fake delay for the premium feel
        setTimeout(() => {
          router.push('/');
        }, 800);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Incorrect email or password.');
      } else {
        setError('A network error occurred. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Mesh Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-[#E8DEF8]/30 blur-[120px] mix-blend-multiply opacity-70 animate-blob"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-[#C2E7FF]/30 blur-[120px] mix-blend-multiply opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-[#F2F0F4]/40 blur-[120px] mix-blend-multiply opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-white/40 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-sm border border-white/50 mb-6">
            <ShieldCheck size={28} className="text-slate-800" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-semibold text-slate-800 tracking-tight text-center">
            Welcome Back
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2 text-center">
            Sign in to access your intelligence dashboard.
          </p>
        </div>

        <form onSubmit={handleLogin} className="glass-panel p-8 md:p-10 rounded-[32px] border border-white/60 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-6 p-4 bg-red-50/50 backdrop-blur-md border border-red-100 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
              <span className="text-sm font-medium text-red-600">{error}</span>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2 pl-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/40 backdrop-blur-md border border-slate-200/60 pl-12 pr-5 py-3.5 rounded-2xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white/60 transition-all shadow-inner-sm"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2 pl-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/40 backdrop-blur-md border border-slate-200/60 pl-12 pr-5 py-3.5 rounded-2xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white/60 transition-all shadow-inner-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-[#202124] text-white px-8 py-4 rounded-2xl font-medium shadow-xl shadow-[#202124]/10 hover:bg-[#3c4043] hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>
        </form>

        {/* Footer Branding */}
        <div className="mt-12 text-center w-full text-slate-500 font-semibold tracking-widest text-[10px] uppercase">
          Premier Agric x Badger Analytics
        </div>
      </div>
    </div>
  );
}
