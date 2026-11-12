import React, { useState } from 'react';
import {
  Download,
  ExternalLink,
  CheckCircle,
  Copy,
  Check,
  Folder,
  AlertCircle,
  FileText,
  ShieldCheck,
  Share2
} from 'lucide-react';
import { Participant, ApiConfig } from '../types';
import { getStudentCertificateDriveLink, saveStoredConfig } from '../services/apiService';

interface CertificateViewerProps {
  participant: Participant;
  apiConfig: ApiConfig;
  onUpdateConfig?: (newConfig: ApiConfig) => void;
  onUpdateParticipant?: (updated: Participant) => void;
}

export const CertificateViewer: React.FC<CertificateViewerProps> = ({
  participant,
  apiConfig,
  onUpdateConfig
}) => {
  const [copied, setCopied] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderInput, setFolderInput] = useState(apiConfig.masterDriveFolderUrl || '');

  const resolved = getStudentCertificateDriveLink(participant, apiConfig.masterDriveFolderUrl);
  const targetDriveUrl = resolved.url;
  const fileName = `${participant.usn}.pdf`;

  const handleCopyLink = () => {
    if (targetDriveUrl) {
      navigator.clipboard.writeText(targetDriveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenDrive = () => {
    if (targetDriveUrl) {
      window.open(targetDriveUrl, '_blank', 'noopener,noreferrer');
    } else {
      setShowFolderModal(true);
    }
  };

  const handleDownload = () => {
    if (targetDriveUrl) {
      window.open(targetDriveUrl, '_blank', 'noopener,noreferrer');
    } else {
      setShowFolderModal(true);
    }
  };

  const handleSaveFolderUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderInput.trim()) return;

    const updated: ApiConfig = {
      ...apiConfig,
      masterDriveFolderUrl: folderInput.trim(),
      lastSyncedAt: new Date().toISOString()
    };
    saveStoredConfig(updated);
    if (onUpdateConfig) {
      onUpdateConfig(updated);
    }
    setShowFolderModal(false);

    const newlyResolved = getStudentCertificateDriveLink(participant, folderInput.trim());
    if (newlyResolved.url) {
      window.open(newlyResolved.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
      {/* Header Info Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-[#1A73E8] shrink-0">
            {/* Google Drive Logo */}
            <svg className="w-6 h-6 fill-current" viewBox="0 0 87.3 78">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.85 10.15z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Certificate Ready for Download
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg mt-1">
              {participant.fullName}’s Official Certificate
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Expected File: <strong className="text-slate-800">{fileName}</strong>
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right text-xs text-slate-500">
          <span className="block font-medium text-slate-700">Design Thinking Course — Field Visit</span>
          <span>Date: 31st October 2026</span>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Open in Google Drive */}
        <button
          onClick={handleOpenDrive}
          className="flex items-center justify-center gap-2.5 px-6 py-4 bg-[#1A73E8] hover:bg-[#1557b0] text-white font-bold rounded-xl text-sm transition-all shadow-sm hover:shadow-md cursor-pointer"
        >
          <span>Open Certificate in Google Drive</span>
          <ExternalLink className="w-4 h-4 text-white" />
        </button>

        {/* Download Certificate */}
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2.5 px-6 py-4 bg-[#0F2942] hover:bg-[#163b5f] text-white font-bold rounded-xl text-sm transition-all shadow-sm hover:shadow-md cursor-pointer"
        >
          <Download className="w-4 h-4 text-white" />
          <span>Download Certificate (PDF)</span>
        </button>
      </div>

      {/* Direct Google Drive Link Copy Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">Official Google Drive Certificate Link:</span>
          <span className="text-slate-500 font-mono">{fileName}</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={targetDriveUrl}
            className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-700 select-all focus:outline-none"
          />

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recipient Verification Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
          <span className="text-slate-400 block text-[11px]">Participant Name</span>
          <span className="font-bold text-slate-900 mt-0.5 block truncate">{participant.fullName}</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
          <span className="text-slate-400 block text-[11px]">USN</span>
          <span className="font-bold font-mono text-slate-900 mt-0.5 block">{participant.usn}</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
          <span className="text-slate-400 block text-[11px]">Department</span>
          <span className="font-semibold text-slate-800 mt-0.5 block truncate">{participant.department}</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
          <span className="text-slate-400 block text-[11px]">File Name</span>
          <span className="font-mono font-semibold text-slate-800 mt-0.5 block">{fileName}</span>
        </div>
      </div>

      {/* Master Folder Quick Access Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/60 border border-blue-200/70 p-3.5 rounded-xl text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-[#1A73E8] shrink-0" />
          <span>
            Looking for all files? Browse the complete{' '}
            <strong className="text-slate-900">GRI Design Thinking Field Visit</strong> shared Drive folder.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={resolved.folderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-300 hover:bg-blue-50 text-[#1A73E8] font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <span>Open All Files in Drive</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => setShowFolderModal(true)}
            className="px-2.5 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-medium cursor-pointer"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Connect Drive Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Folder className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Google Drive Certificate Folder</h3>
                  <p className="text-xs text-slate-500">Shared certificate repository</p>
                </div>
              </div>
              <button
                onClick={() => setShowFolderModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFolderUrl} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Google Drive Shared Folder Link:
                </label>
                <input
                  type="url"
                  required
                  autoFocus
                  value={folderInput}
                  onChange={e => setFolderInput(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/1CX3U5m8HETR8GKP_4jIuXg02VK5JuO9v..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3 text-slate-600 space-y-1">
                <span className="font-semibold text-slate-800 block">Repository Rule:</span>
                <p>
                  Certificates are matched starting with the student's USN (e.g.{' '}
                  <code className="bg-white px-1 py-0.5 rounded border border-blue-200 font-mono text-slate-800">
                    {participant.usn}.pdf
                  </code>
                  ).
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#1A73E8] hover:bg-blue-600 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
