import React, { useState, useEffect } from 'react';
import {
  Users,
  Send,
  CheckCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Settings,
  MailCheck,
  FileSpreadsheet,
  Eye,
  Check,
  X,
  ExternalLink,
  Edit2,
  Folder,
  FolderSync,
  LogOut,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Participant, ApiConfig } from '../types';
import {
  sendParticipantEmail,
  updateParticipantDriveLink,
  OFFICIAL_GRI_DRIVE_FOLDER_URL
} from '../services/apiService';
import {
  initAuth,
  googleSignIn,
  googleLogout,
  listFolderDriveFiles,
  matchDriveFilesToParticipants
} from '../services/googleDriveAuth';
import { CertificateViewer } from './CertificateViewer';

interface AdminPanelProps {
  participants: Participant[];
  onRefresh: () => void;
  onOpenSettings: () => void;
  apiConfig: ApiConfig;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  participants,
  onRefresh,
  onOpenSettings,
  apiConfig
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isBulkDispatching, setIsBulkDispatching] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [previewParticipant, setPreviewParticipant] = useState<Participant | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [driveUrlInput, setDriveUrlInput] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  // Google Drive OAuth state
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsSigningInGoogle(true);
    setActionError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        setActionMessage(`Connected Google Drive as ${res.user.email}!`);
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google Sign-in failed';
      setActionError(`Google Authentication: ${msg}`);
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await googleLogout();
    setGoogleUser(null);
    setGoogleToken(null);
    setActionMessage('Disconnected Google Drive session.');
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleSyncDriveFolder = async () => {
    const folderUrl = apiConfig.masterDriveFolderUrl || OFFICIAL_GRI_DRIVE_FOLDER_URL;
    const match = folderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    const folderId = match ? match[1] : '1CX3U5m8HETR8GKP_4jIuXg02VK5JuO9v';

    if (!googleToken) {
      // Prompt user to sign in first
      handleGoogleLogin();
      return;
    }

    setIsDriveSyncing(true);
    setActionError(null);
    setActionMessage('Querying Google Drive API for certificate files...');

    const res = await listFolderDriveFiles(folderId, googleToken);
    setIsDriveSyncing(false);

    if (res.error) {
      setActionError(res.error);
      return;
    }

    if (res.files.length === 0) {
      setActionMessage(
        `Connected to Google Drive folder (${folderId}), but no files were returned. Ensure files are shared or uploaded with [USN].pdf naming.`
      );
      return;
    }

    const { matchedCount } = matchDriveFilesToParticipants(participants, res.files);
    onRefresh();
    setActionMessage(
      `Drive Sync Success! Found ${res.files.length} files in Google Drive. Automatically matched and updated ${matchedCount} student certificates!`
    );
    setTimeout(() => setActionMessage(null), 6000);
  };

  // Derived KPI calculations
  const totalCount = participants.length;
  const sentCount = participants.filter(p => p.emailDeliveryStatus === 'Delivered').length;
  const pendingCount = participants.filter(p => p.emailDeliveryStatus === 'Pending').length;
  const matchedCount = participants.filter(p => p.certificateMatched).length;

  const departments = ['All', ...Array.from(new Set(participants.map(p => p.department)))];

  // Filtering logic
  const filteredParticipants = participants.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.fullName.toLowerCase().includes(term) ||
      p.usn.toLowerCase().includes(term) ||
      p.collegeEmail.toLowerCase().includes(term);

    const matchesDept = departmentFilter === 'All' || p.department === departmentFilter;
    const matchesStatus = statusFilter === 'All' || p.emailDeliveryStatus === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleSendIndividual = async (p: Participant) => {
    setSendingId(p.id);
    setActionMessage(`Dispatching certificate email to ${p.collegeEmail}...`);
    const res = await sendParticipantEmail(p.id);
    setActionMessage(res.message);
    setSendingId(null);
    onRefresh();
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleSaveDriveUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingParticipant) return;
    updateParticipantDriveLink(editingParticipant.id, driveUrlInput);
    setActionMessage(`Updated Google Drive certificate file link for ${editingParticipant.fullName} (${editingParticipant.usn}).`);
    setEditingParticipant(null);
    onRefresh();
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleBulkDispatch = async () => {
    const pendingList = participants.filter(p => p.emailDeliveryStatus === 'Pending');
    if (pendingList.length === 0) {
      alert('All 23 participant certificates have already been delivered.');
      return;
    }

    if (!confirm(`Confirm dispatch of ${pendingList.length} pending certificates to students' college email addresses?`)) {
      return;
    }

    setIsBulkDispatching(true);
    setBulkProgress(0);

    for (let i = 0; i < pendingList.length; i++) {
      const p = pendingList[i];
      await sendParticipantEmail(p.id);
      setBulkProgress(Math.round(((i + 1) / pendingList.length) * 100));
      await new Promise(r => setTimeout(r, 200));
    }

    setIsBulkDispatching(false);
    onRefresh();
    setActionMessage(`Bulk dispatch complete! Successfully sent ${pendingList.length} certificate emails.`);
    setTimeout(() => setActionMessage(null), 5000);
  };

  const exportCSV = () => {
    const headers = ['SL No', 'Full Name', 'USN', 'College Email', 'Department', 'Certificate Matched', 'Delivery Status', 'Delivery Timestamp'];
    const rows = participants.map(p => [
      p.slNo,
      `"${p.fullName}"`,
      p.usn,
      p.collegeEmail,
      `"${p.department}"`,
      p.certificateMatched ? 'Yes' : 'No',
      p.emailDeliveryStatus,
      `"${p.deliveryTimestamp || 'Pending'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GRI_DesignThinking_FieldVisit_Certificates_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Admin Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <img
            src="/assets/aistudio/cf5c58d0-12a9-4626-be9f-a04f5ce6e0f2-removebg-preview_1a1edeb0.png"
            alt="GRI Logo"
            className="w-12 h-12 object-contain shrink-0 drop-shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Organizer Certificate Distribution Console
              </h2>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono border border-slate-200">
                PIN Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Design Thinking Course — Field Visit (31st October 2026) · Official Cohort Registry
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Google Apps Script Endpoint</span>
          </button>

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 cursor-pointer"
            title="Refresh Cohort Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div className="bg-blue-50 border border-blue-200 text-[#1A73E8] px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#1A73E8] shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-xs font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Action Error Message */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-xs font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Google Drive Workspace Integration Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0">
            {/* Google Drive Icon */}
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
              <h3 className="text-sm font-bold text-slate-900">Google Drive Workspace Integration</h3>
              {googleUser ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  Connected: {googleUser.email}
                </span>
              ) : (
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                  OAuth Ready
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Target Folder:{' '}
              <a
                href={apiConfig.masterDriveFolderUrl || OFFICIAL_GRI_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[#1A73E8] hover:underline"
              >
                1CX3U5m8HETR8GKP_4jIuXg02VK5JuO9v
              </a>{' '}
              · Certificate naming rule: <span className="font-mono text-slate-700 font-semibold">[USN].pdf</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {googleUser ? (
            <>
              <button
                onClick={handleSyncDriveFolder}
                disabled={isDriveSyncing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A73E8] hover:bg-blue-600 disabled:opacity-60 text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <FolderSync className={`w-3.5 h-3.5 ${isDriveSyncing ? 'animate-spin' : ''}`} />
                <span>{isDriveSyncing ? 'Syncing...' : 'Sync Certificates from Drive'}</span>
              </button>

              <a
                href={apiConfig.masterDriveFolderUrl || OFFICIAL_GRI_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Open Drive Folder</span>
              </a>

              <button
                onClick={handleGoogleSignOut}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-200 cursor-pointer"
                title="Disconnect Google Account"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              {/* Official Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSigningInGoogle}
                className="gsi-material-button shadow-2xs hover:shadow-xs"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">
                    {isSigningInGoogle ? 'Connecting...' : 'Sign in with Google'}
                  </span>
                </div>
              </button>

              <a
                href={apiConfig.masterDriveFolderUrl || OFFICIAL_GRI_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors whitespace-nowrap"
              >
                <Folder className="w-3.5 h-3.5 text-blue-600" />
                <span>Open Folder Directly</span>
              </a>
            </>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Participants */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Participants</span>
            <Users className="w-4 h-4 text-[#0F2942]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">{totalCount}</span>
            <span className="text-xs text-slate-500">registered</span>
          </div>
        </div>

        {/* Certificates Matched */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Matched to Drive</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">{matchedCount}</span>
            <span className="text-xs text-emerald-600 font-medium">100% matched</span>
          </div>
        </div>

        {/* Certificates Sent */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Certificates Sent</span>
            <MailCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-700 font-mono">{sentCount}</span>
            <span className="text-xs text-slate-500">delivered</span>
          </div>
        </div>

        {/* Pending / Missing */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending / Queue</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-700 font-mono">{pendingCount}</span>
            <span className="text-xs text-slate-500">awaiting send</span>
          </div>
        </div>
      </div>

      {/* Bulk Dispatch Banner */}
      <div className="bg-gradient-to-r from-[#0F2942] to-[#153e68] text-white p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-white">Bulk Email Dispatch Engine</h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Automate personalized certificate dispatch to all {pendingCount} participants with pending delivery status.
          </p>
        </div>

        <div className="w-full md:w-auto flex items-center gap-3">
          {isBulkDispatching && (
            <div className="w-36 bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-full transition-all duration-300"
                style={{ width: `${bulkProgress}%` }}
              />
            </div>
          )}

          <button
            onClick={handleBulkDispatch}
            disabled={isBulkDispatching || pendingCount === 0}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1A73E8] hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5 text-white" />
            <span>
              {isBulkDispatching
                ? `Dispatching (${bulkProgress}%)...`
                : `Dispatch All Pending Certificates (${pendingCount})`}
            </span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by participant name, USN, or email..."
            className="w-full pl-10 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5" />
            <span>Dept:</span>
          </div>
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 focus:outline-none focus:bg-white cursor-pointer"
          >
            {departments.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 focus:outline-none focus:bg-white cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Delivered">Delivered</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Participants Master Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">SL</th>
                <th className="py-3 px-4">Participant Name</th>
                <th className="py-3 px-4">USN</th>
                <th className="py-3 px-4">College Email Id</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Certificate Match</th>
                <th className="py-3 px-4 text-center">Email Delivery</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParticipants.map(participant => (
                <tr key={participant.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-center text-slate-400 font-medium">
                    {participant.slNo}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900 block">{participant.fullName}</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-700">
                    {participant.usn}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                    {participant.collegeEmail}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {participant.department}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {participant.certificateDriveUrl ? (
                        <a
                          href={participant.certificateDriveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open Drive Certificate"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md transition-colors"
                        >
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Drive File</span>
                          <ExternalLink className="w-2.5 h-2.5 text-emerald-600" />
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          <X className="w-3 h-3 text-amber-600" />
                          Missing
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setEditingParticipant(participant);
                          setDriveUrlInput(participant.certificateDriveUrl || '');
                        }}
                        title="Edit Google Drive File Link"
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {participant.emailDeliveryStatus === 'Delivered' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                        <MailCheck className="w-3 h-3 text-blue-600" />
                        Delivered
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setPreviewParticipant(participant)}
                        title="View Certificate Details"
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleSendIndividual(participant)}
                        disabled={sendingId === participant.id}
                        title="Send Individual Email"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-[#1A73E8] hover:text-white text-slate-700 rounded-lg transition-colors border border-slate-200 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                        <span>{sendingId === participant.id ? 'Sending...' : 'Send'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredParticipants.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              No matching participant records found for the applied search criteria.
            </div>
          )}
        </div>
      </div>

      {/* Certificate Preview Modal */}
      {previewParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Certificate Drive Access</h3>
                <p className="text-xs text-slate-500">
                  {previewParticipant.fullName} · {previewParticipant.usn} ({previewParticipant.department})
                </p>
              </div>
              <button
                onClick={() => setPreviewParticipant(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold px-2 py-1 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <CertificateViewer
              participant={previewParticipant}
              apiConfig={apiConfig}
              onUpdateParticipant={updated => {
                setPreviewParticipant(updated);
                onRefresh();
              }}
            />
          </div>
        </div>
      )}

      {/* Edit Google Drive File Link Modal */}
      {editingParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Update Drive Certificate Link</h3>
                <p className="text-xs text-slate-500">{editingParticipant.fullName} ({editingParticipant.usn})</p>
              </div>
              <button
                onClick={() => setEditingParticipant(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDriveUrl} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Drive File View or Sharing URL:
                </label>
                <input
                  type="url"
                  value={driveUrlInput}
                  onChange={e => setDriveUrlInput(e.target.value)}
                  placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Paste the Google Drive link to this student's certificate PDF. The system will automatically configure direct preview and download.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingParticipant(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1A73E8] hover:bg-blue-600 rounded-xl shadow-xs transition-colors cursor-pointer"
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
