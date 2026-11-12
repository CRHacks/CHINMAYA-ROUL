import React, { useState } from 'react';
import { Search, ShieldCheck, Mail, AlertCircle, ArrowRight, ExternalLink, Sparkles, CheckCircle2, Award, Folder } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Participant, ApiConfig } from '../types';
import { CertificateViewer } from './CertificateViewer';
import { saveStoredConfig } from '../services/apiService';

interface StudentPortalProps {
  participants: Participant[];
  apiConfig: ApiConfig;
  onUpdateConfig: (newConfig: ApiConfig) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  participants,
  apiConfig,
  onUpdateConfig
}) => {
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [matchedParticipant, setMatchedParticipant] = useState<Participant | null>(null);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [folderInputVal, setFolderInputVal] = useState(apiConfig.masterDriveFolderUrl || '');

  const performSearch = (searchVal: string) => {
    const clean = searchVal.trim().toLowerCase();
    if (!clean) return;

    setHasSearched(true);
    const result = participants.find(
      p =>
        p.usn.toLowerCase() === clean ||
        p.collegeEmail.toLowerCase() === clean ||
        p.usn.toLowerCase().replace(/\s+/g, '') === clean.replace(/\s+/g, '') ||
        p.fullName.toLowerCase() === clean
    );

    setMatchedParticipant(result || null);

    if (result) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore confetti errors in restricted environments
      }
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    performSearch(query);
  };

  const handleSampleFill = (sampleVal: string) => {
    setQuery(sampleVal);
    performSearch(sampleVal);
  };

  const handleSaveDriveFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderInputVal.trim()) return;
    const updated = {
      ...apiConfig,
      masterDriveFolderUrl: folderInputVal.trim(),
      lastSyncedAt: new Date().toISOString()
    };
    saveStoredConfig(updated);
    onUpdateConfig(updated);
    setShowDriveModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-3.5">
        <div className="flex justify-center">
          <img
            src="/assets/aistudio/cf5c58d0-12a9-4626-be9f-a04f5ce6e0f2-removebg-preview_1a1edeb0.png"
            alt="Centre for Grassroots Research and Innovation Emblem"
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-sm"
          />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#1A73E8] border border-blue-200">
          <ShieldCheck className="w-3.5 h-3.5 text-[#1A73E8]" />
          <span>Official Verification &amp; Credential Portal</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0F2942] tracking-tight">
          Design Thinking Field Visit — Official Certificate Portal
        </h2>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Official digital credentials for the experiential fieldwork program held on{' '}
          <strong className="text-slate-900 font-semibold">31st October 2026</strong>. Enter your university credentials below to verify and retrieve your certificate.
        </p>
      </div>

      {/* Google Drive Shared Folder Connection Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 px-4 py-3 rounded-xl shadow-2xs text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1A73E8] flex items-center justify-center shrink-0">
            <Folder className="w-4 h-4" />
          </div>
          <div>
            {apiConfig.masterDriveFolderUrl ? (
              <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Google Drive Certificate Folder Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Google Drive Certificate Folder: Not Linked Yet</span>
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-0.5">
              {apiConfig.masterDriveFolderUrl
                ? 'Certificates will be retrieved directly from the linked Google Drive folder'
                : 'Connect the shared folder containing [USN].pdf certificates'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={apiConfig.masterDriveFolderUrl || 'https://drive.google.com/drive/folders/1CX3U5m8HETR8GKP_4jIuXg02VK5JuO9v?usp=drive_link'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-[#1A73E8] hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <span>Open Folder</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => setShowDriveModal(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer shrink-0"
          >
            {apiConfig.masterDriveFolderUrl ? 'Change Drive Link' : 'Connect Drive Folder'}
          </button>
        </div>
      </div>

      {/* Search Input Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div>
            <label htmlFor="student-search-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Enter University Serial Number (USN) or College Email ID:
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="student-search-input"
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="e.g. 25BTRSN018 or juug25btech27079@jainuniversity.ac.in"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:bg-white transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-[#0F2942] hover:bg-[#1A73E8] text-white font-semibold rounded-xl text-sm transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span>Verify &amp; Search</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick-fill sample buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
            <span className="font-medium text-slate-600">Quick Test Records:</span>
            <button
              type="button"
              onClick={() => handleSampleFill('25BTRSN018')}
              className="font-mono bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 transition-colors cursor-pointer"
            >
              25BTRSN018 (Imran)
            </button>
            <button
              type="button"
              onClick={() => handleSampleFill('25BTRCL036')}
              className="font-mono bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 transition-colors cursor-pointer"
            >
              25BTRCL036 (Bhuvaneshwari)
            </button>
            <button
              type="button"
              onClick={() => handleSampleFill('25BTRSN014')}
              className="font-mono bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 transition-colors cursor-pointer"
            >
              25BTRSN014 (Gadha)
            </button>
          </div>
        </form>
      </div>

      {/* Matched Participant Result State */}
      {hasSearched && matchedParticipant && (
        <div className="space-y-6 animate-fadeIn">
          {/* Result Card upon match */}
          <div className="bg-white rounded-2xl border border-emerald-300 p-5 sm:p-6 shadow-sm bg-gradient-to-r from-emerald-50/50 via-white to-blue-50/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Officially Verified by GRI
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Cohort Entry #{matchedParticipant.slNo}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5">
                  {matchedParticipant.fullName}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Department of {matchedParticipant.department} · Faculty of Engineering and Technology
                </p>
              </div>

              <div className="text-left sm:text-right sm:border-l sm:border-slate-200 sm:pl-6 text-xs text-slate-600 space-y-1">
                <div>
                  <span className="text-slate-500">USN: </span>
                  <span className="font-mono font-bold text-slate-900">{matchedParticipant.usn}</span>
                </div>
                <div>
                  <span className="text-slate-500">College Email: </span>
                  <span className="font-mono text-slate-800">{matchedParticipant.collegeEmail}</span>
                </div>
                <div>
                  <span className="text-slate-500">Event Date: </span>
                  <span className="font-semibold text-slate-900">31st October 2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Google Drive Certificate Link & Download Card */}
          <CertificateViewer
            participant={matchedParticipant}
            apiConfig={apiConfig}
            onUpdateConfig={onUpdateConfig}
            onUpdateParticipant={updated => setMatchedParticipant(updated)}
          />

          {/* Prominent "Stay Connected with GRI" callout card */}
          <div className="bg-gradient-to-br from-[#0F2942] to-[#153e68] text-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-center md:text-left">
                <img
                  src="/assets/aistudio/cf5c58d0-12a9-4626-be9f-a04f5ce6e0f2-removebg-preview_1a1edeb0.png"
                  alt="GRI Logo"
                  className="w-16 h-16 object-contain shrink-0 hidden sm:block drop-shadow-md"
                />
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Grassroots Innovation Ecosystem
                  </span>
                  <h4 className="text-xl font-bold text-white">Stay Connected with GRI</h4>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
                    Join our vibrant student innovator network. Follow GRI on LinkedIn and Instagram (@jainresearch_gri) for updates on hackathons, field research grants, patent incubation, and grassroots design fellowships.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                <a
                  href="https://www.linkedin.com/company/centre-for-grassroots-research-innovation-gri/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white text-xs font-semibold transition-all shadow-xs"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  <span>Connect on LinkedIn</span>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
                </a>

                <a
                  href="https://www.instagram.com/jainresearch_gri?xtok=ZnB1cW9xZnYxbHFq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-95 text-white text-xs font-semibold transition-all shadow-xs"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.79-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>Follow @jainresearch_gri</span>
                  <ExternalLink className="w-3.5 h-3.5 text-pink-200" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Graceful Not Found State */}
      {hasSearched && !matchedParticipant && (
        <div className="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 text-center space-y-4 shadow-xs animate-fadeIn">
          <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-amber-700">
            <AlertCircle className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              No Participant Found for “{query}”
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              We couldn’t find an entry matching this identifier in the official Design Thinking Field Visit attendance register. Please verify your USN (e.g. 25BTRSN018) or official college email.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                setQuery('');
                setHasSearched(false);
              }}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Clear &amp; Try Again
            </button>
            <a
              href="mailto:creativetech036@gmail.com?subject=GRI%20Design%20Thinking%20Field%20Visit%20Certificate%20Query"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#0F2942] hover:bg-[#1A73E8] px-4 py-2 rounded-lg transition-colors shadow-2xs"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact Organizer Support (creativetech036@gmail.com)</span>
            </a>
          </div>
        </div>
      )}

      {/* Connect Google Drive Shared Folder Modal */}
      {showDriveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Folder className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Connect Google Drive Certificate Folder</h3>
                  <p className="text-xs text-slate-500">Shared folder containing all participant certificates</p>
                </div>
              </div>
              <button
                onClick={() => setShowDriveModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDriveFolder} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Google Drive Shared Folder Link:
                </label>
                <input
                  type="url"
                  required
                  autoFocus
                  value={folderInputVal}
                  onChange={e => setFolderInputVal(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/1BxiMVs0XRA5..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3 text-slate-600 space-y-1">
                <span className="font-semibold text-slate-800 block">How certificates match:</span>
                <p>
                  Because your certificates are named starting with each student's USN (e.g. <code className="bg-white px-1 py-0.5 rounded border border-blue-200 font-mono text-slate-800">25BTRSN018.pdf</code>), saving this folder URL enables instant, error-free Google Drive links for all students without any 404 broken links.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDriveModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#1A73E8] hover:bg-blue-600 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save &amp; Connect Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
