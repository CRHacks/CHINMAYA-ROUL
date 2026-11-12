import React from 'react';
import { Award, Lock } from 'lucide-react';
import { ActiveView } from '../types';

interface HeaderProps {
  activeView: ActiveView;
  onOpenPinModal: () => void;
  onExitAdmin: () => void;
  isAdminAuthenticated: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onOpenPinModal,
  onExitAdmin,
  isAdminAuthenticated
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Institutional Top Bar */}
      <div className="bg-[#0F2942] text-slate-100 py-1.5 px-4 text-xs font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Design Thinking Course — Field Visit (31st October 2026)</span>
            <span className="text-slate-400 hidden sm:inline">· Official Verification Portal</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-slate-300">
            <span>Faculty of Engineering and Technology</span>
            <span>·</span>
            <span>JAIN (Deemed-to-be University)</span>
          </div>
        </div>
      </div>

      {/* Main Header Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <img
            src="/assets/aistudio/cf5c58d0-12a9-4626-be9f-a04f5ce6e0f2-removebg-preview_1a1edeb0.png"
            alt="Centre for Grassroots Research and Innovation Emblem"
            className="w-12 h-12 object-contain shrink-0 drop-shadow-xs"
          />

          <div>
            <a href="#" onClick={(e) => { e.preventDefault(); onExitAdmin(); }} className="hover:opacity-90 transition-opacity">
              <h1 className="font-bold text-slate-900 text-sm sm:text-base leading-tight tracking-tight">
                Centre for Grassroots Research & Innovation (GRI)
              </h1>
            </a>
            <p className="text-xs text-slate-600 font-normal leading-tight mt-0.5">
              Office of Research | Faculty of Engineering and Technology, JAIN (Deemed-to-be University)
            </p>
          </div>
        </div>

        {/* Action Controls & Social Shortcuts */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* LinkedIn Quick Action */}
          <a
            href="https://www.linkedin.com/company/centre-for-grassroots-research-innovation-gri/"
            target="_blank"
            rel="noopener noreferrer"
            title="GRI Official LinkedIn"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-[#0A66C2] hover:border-[#0A66C2]/40 hover:bg-blue-50/50 transition-all whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5 fill-current text-[#0A66C2]" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
            <span className="hidden lg:inline">LinkedIn</span>
          </a>

          {/* Instagram Quick Action */}
          <a
            href="https://www.instagram.com/jainresearch_gri?xtok=ZnB1cW9xZnYxbHFq"
            target="_blank"
            rel="noopener noreferrer"
            title="Follow @jainresearch_gri on Instagram"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-pink-600 hover:border-pink-300 hover:bg-pink-50/50 transition-all whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5 fill-current text-[#E4405F]" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.79-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <span className="hidden lg:inline">@jainresearch_gri</span>
          </a>

          {/* Organizer / Student Mode Switch */}
          {activeView === 'student' ? (
            <button
              onClick={onOpenPinModal}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              <span>Organizer Admin</span>
            </button>
          ) : (
            <button
              onClick={onExitAdmin}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[#0F2942] hover:bg-[#1A73E8] text-white transition-colors whitespace-nowrap"
            >
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Student Portal</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
