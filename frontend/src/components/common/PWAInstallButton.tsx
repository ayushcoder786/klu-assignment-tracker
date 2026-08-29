import React, { useState } from 'react';
import { FiDownload, FiShare, FiPlusSquare, FiX } from 'react-icons/fi';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  showIOSHelp?: boolean;
}

export function PWAInstallButton({ className = '', showIOSHelp = true }: PWAInstallButtonProps) {
  const { canInstall, isInstalled, isStandalone, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running in standalone/PWA mode or installed, do not show the button
  if (isStandalone || isInstalled) {
    return null;
  }

  // If browser does not support beforeinstallprompt and not on iOS, gracefully hide
  if (!canInstall && (!isIOS || !showIOSHelp)) {
    return null;
  }

  const handleClick = async () => {
    if (canInstall) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS && showIOSHelp) {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isInstalling}
        aria-label="Install KLU Assignment Tracker App"
        title="Install KLU Assignment Tracker as an App"
        className={`
          group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
          text-xs font-semibold
          text-indigo-700 hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-white
          bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 active:bg-indigo-200 dark:active:bg-indigo-950
          border border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-300 dark:hover:border-indigo-400/60
          shadow-xs dark:shadow-sm dark:shadow-indigo-950/30
          transition-all duration-200 cursor-pointer
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#090d1a]
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        <FiDownload
          size={13}
          className="text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-800 dark:group-hover:text-indigo-200 transition-transform duration-200 group-hover:-translate-y-0.5 group-active:translate-y-0"
        />
        <span>Install</span>
      </button>

      {/* iOS Add to Home Screen Instructions Modal */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/70 backdrop-blur-sm"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-800 dark:text-slate-100 space-y-4"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div className="flex items-center justify-between">
              <h3 id="ios-install-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FiDownload size={18} className="text-indigo-600 dark:text-indigo-400" />
                Install on iOS
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              To install <strong>KLU Assignment Tracker</strong> on your iPhone or iPad:
            </p>

            <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2.5 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <li className="flex items-start gap-2">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">1.</span>
                <span>Tap the <strong>Share</strong> button <FiShare className="inline text-indigo-600 dark:text-indigo-400 mx-0.5" size={13} /> in Safari's toolbar.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">2.</span>
                <span>Scroll down and select <strong>Add to Home Screen</strong> <FiPlusSquare className="inline text-indigo-600 dark:text-indigo-400 mx-0.5" size={13} />.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">3.</span>
                <span>Tap <strong>Add</strong> in the top-right corner.</span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
