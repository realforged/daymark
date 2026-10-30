import React, { useState } from 'react';
import { X, Mail, Lock, LogIn, UserPlus, LogOut, Cloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, signInWithOtp, signOut } from '../services/supabaseClient';
import { supabaseSync } from '../services/supabaseSync';
import { User } from '@supabase/supabase-js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
  onSyncComplete: () => void;
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  onSyncComplete,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'magic'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'magic') {
        const { error } = await signInWithOtp(email.trim());
        if (error) {
          setErrorMsg(error);
        } else {
          setSuccessMsg('Check your inbox! We sent you a secure magic login link.');
        }
      } else if (mode === 'signup') {
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }
        const { user, error } = await signUpWithEmail(email.trim(), password);
        if (error) {
          setErrorMsg(error);
        } else {
          setSuccessMsg('Account created successfully! Check your email to confirm registration or sign in.');
          onUserChange(user);
          if (user) {
            await supabaseSync.pushToCloud();
            onSyncComplete();
          }
        }
      } else {
        // Sign In
        const { user, error } = await signInWithEmail(email.trim(), password);
        if (error) {
          setErrorMsg(error);
        } else {
          onUserChange(user);
          setSuccessMsg('Signed in successfully! Syncing your data...');
          await supabaseSync.pullFromCloud();
          onSyncComplete();
          setTimeout(() => {
            onClose();
          }, 800);
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
    onUserChange(null);
    setLoading(false);
    onClose();
  };

  const handleManualSync = async () => {
    setLoading(true);
    setErrorMsg(null);
    const ok = await supabaseSync.pushToCloud();
    setLoading(false);
    if (ok) {
      setSuccessMsg('Local data uploaded and synchronized with Supabase!');
      onSyncComplete();
    } else {
      setErrorMsg('Failed to synchronize with Supabase. Check your connection.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#141418] border border-white/10 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">
              {currentUser ? 'Supabase Account' : 'Cloud Synchronization'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentUser ? (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Connected & Authenticated</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-300 font-mono break-all">
                {currentUser.email}
              </p>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Your habits, daily tasks, deadline journey, and evening reflections are protected with Supabase Row Level Security (RLS).
            </p>

            {successMsg && (
              <div className="p-3 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleManualSync}
                disabled={loading}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                <span>Sync Now</span>
              </button>
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="py-2.5 px-4 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="flex rounded-lg bg-black/40 p-1 border border-white/5 text-xs">
              <button
                onClick={() => { setMode('signin'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                  mode === 'signin' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('signup'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                  mode === 'signup' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
              <button
                onClick={() => { setMode('magic'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                  mode === 'magic' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Magic Link
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-black/40 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {mode !== 'magic' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-black/40 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : mode === 'signup' ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account & Sync</span>
                  </>
                ) : mode === 'magic' ? (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Send Magic Login Link</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In & Restore</span>
                  </>
                )}
              </button>
            </form>

            <p className="text-[11px] text-slate-500 text-center">
              DAYMARK stores your progress offline locally. Signing in syncs your journey across your phone and desktop.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
