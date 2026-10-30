import React, { useState } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<Props> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      await install();
      setIsInstalling(false);
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Desktop / Android browser without prompt fired yet
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {variant === 'compact' ? (
        <button
          onClick={handleInstallClick}
          aria-label="Install DAYMARK App"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 rounded-md hover:bg-emerald-900/30 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Install App</span>
        </button>
      ) : (
        <div className="p-4 bg-[#141418] border border-white/5 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Install DAYMARK on Home Screen</h4>
              <p className="text-xs text-slate-400">Quick access, offline persistence, and zero browser chrome.</p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="px-4 py-2 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            {isInstalling ? 'Installing...' : 'Install Now'}
          </button>
        </div>
      )}

      {/* Installation Guide Modal (for iOS Safari or manual instruction) */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#141418] border border-white/10 p-6 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-semibold text-white">Install on Device</h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <p className="text-slate-400">
                To experience DAYMARK as a full standalone app without browser bars:
              </p>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs shrink-0">1</span>
                  <span>Tap the <strong>Share</strong> icon (iOS Safari) or the <strong>Three Dots Menu</strong> (Android / Chrome).</span>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs shrink-0">2</span>
                  <span>Scroll down and select <strong>"Add to Home Screen"</strong> or <strong>"Install app"</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs shrink-0">3</span>
                  <span>Tap <strong>Add</strong> to launch DAYMARK directly from your home screen.</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
