import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert } from 'lucide-react';

interface PinAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PinAuthModal: React.FC<PinAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === '4200') {
      setError(false);
      setPin('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
        <div className="flex justify-center">
          <img
            src="/assets/aistudio/cf5c58d0-12a9-4626-be9f-a04f5ce6e0f2-removebg-preview_1a1edeb0.png"
            alt="GRI Official Emblem"
            className="w-16 h-16 object-contain drop-shadow-sm"
          />
        </div>

        <div>
          <h3 className="font-bold text-slate-900 text-lg">Organizer Verification</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Enter the authorized coordinator passcode to access the administrative distribution console.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <input
            type="password"
            maxLength={6}
            autoFocus
            value={pin}
            onChange={e => {
              setPin(e.target.value);
              setError(false);
            }}
            placeholder="••••"
            className={`w-36 mx-auto text-center font-mono text-2xl tracking-widest py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 ${
              error
                ? 'border-red-400 focus:ring-red-400 text-red-600 bg-red-50/40'
                : 'border-slate-300 focus:ring-blue-500 text-slate-800'
            }`}
          />

          {error && (
            <div className="flex items-center justify-center gap-1 text-xs font-semibold text-red-600 animate-fadeIn">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Incorrect passcode. Please enter the authorized PIN.</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#0F2942] hover:bg-[#1A73E8] rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Unlock Console</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
