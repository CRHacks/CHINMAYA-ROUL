import React, { useState } from 'react';
import { Save, Code2, Check, Copy, Link, CheckCircle, AlertCircle } from 'lucide-react';
import { ApiConfig } from '../types';
import { saveStoredConfig } from '../services/apiService';

interface ApiConfigModalProps {
  config: ApiConfig;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (newConfig: ApiConfig) => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  config,
  isOpen,
  onClose,
  onSaved
}) => {
  const [url, setUrl] = useState(config.scriptUrl || '');
  const [driveFolderUrl, setDriveFolderUrl] = useState(config.masterDriveFolderUrl || '');
  const [isMockMode, setIsMockMode] = useState(config.isMockMode);
  const [copied, setCopied] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState('');

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!url.trim()) {
      setTestStatus('failed');
      setTestMessage('Please enter a Google Apps Script Web App URL to test.');
      return;
    }

    setTestStatus('testing');
    try {
      const resp = await fetch(`${url.trim()}?action=getParticipants`, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });
      if (resp.ok) {
        setTestStatus('success');
        setTestMessage('Connected successfully! Apps Script returned a valid response.');
      } else {
        setTestStatus('failed');
        setTestMessage(`Received HTTP status ${resp.status}. Please check Web App permissions.`);
      }
    } catch (err: unknown) {
      setTestStatus('failed');
      const errStr = err instanceof Error ? err.message : 'Network error';
      setTestMessage(`Failed to reach endpoint: ${errStr}. Ensure "Execute as: Me" and "Who has access: Anyone".`);
    }
  };

  const handleSave = () => {
    const updated: ApiConfig = {
      scriptUrl: url.trim(),
      isMockMode: url.trim().length === 0 ? true : isMockMode,
      masterDriveFolderUrl: driveFolderUrl.trim(),
      lastSyncedAt: new Date().toISOString()
    };
    saveStoredConfig(updated);
    onSaved(updated);
    onClose();
  };

  const sampleAppsScriptCode = `/**
 * Google Apps Script Web App for GRI Certificate Verification & Dispatch
 * Deploy as: Web app -> Execute as: Me -> Who has access: Anyone
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'getParticipants';
  
  if (action === 'getParticipants') {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Participants') || ss.getSheets()[0];
    var data = sheet.getDataRange().getValues();
    
    // Parse rows into JSON objects
    var participants = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (row[0]) {
        participants.push({
          id: 'p-' + i,
          slNo: row[0],
          fullName: row[1],
          usn: String(row[2]).trim(),
          collegeEmail: String(row[3]).trim(),
          department: row[4],
          certificateDriveUrl: row[5] || '',
          certificatePreviewUrl: row[5] || '',
          certificateMatched: Boolean(row[5]),
          emailDeliveryStatus: row[6] === 'Delivered' ? 'Delivered' : 'Pending'
        });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      participants: participants
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action === 'sendSingleCertificate') {
      var subject = "Your Certificate of Participation – Design Thinking Course Field Visit";
      var body = "Dear " + data.fullName + " (" + data.usn + "),\\n\\n" +
        "Congratulations on completing the Design Thinking Field Visit conducted on 31st October 2026 by GRI.\\n\\n" +
        "Please download your certificate from the official portal or your drive link.\\n\\n" +
        "Warm regards,\\nCentre for Grassroots Research & Innovation (GRI)\\nJAIN (Deemed-to-be University)";
      
      MailApp.sendEmail(data.email, subject, body);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const copyScript = () => {
    navigator.clipboard.writeText(sampleAppsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Google Apps Script Web App Endpoint</h3>
            <p className="text-xs text-slate-500">Connect to your real Google Sheet backend &amp; MailApp email queue</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 space-y-2">
            <label className="block font-bold text-slate-800">
              Master Google Drive Certificate Folder Link:
            </label>
            <input
              type="url"
              value={driveFolderUrl}
              onChange={e => setDriveFolderUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZj..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Paste the single shared Google Drive folder containing all participant certificates (named e.g. <code className="font-mono bg-white px-1 py-0.5 rounded border border-blue-200">25BTRSN018.pdf</code>). When configured, students will directly open and download their own certificate without 404 errors.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Google Apps Script Web App Deployment URL (`/exec`):
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={e => {
                  setUrl(e.target.value);
                  setTestStatus('idle');
                }}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl border border-slate-300 transition-colors whitespace-nowrap cursor-pointer"
              >
                {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Leave blank to operate automatically in self-contained mode with the preloaded 23 participant records.
            </p>
          </div>

          {testStatus !== 'idle' && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                testStatus === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : testStatus === 'failed'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              {testStatus === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <span>{testMessage}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="mock-mode-toggle"
              checked={isMockMode}
              onChange={e => setIsMockMode(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="mock-mode-toggle" className="font-medium text-slate-700 cursor-pointer">
              Force Local Simulation Mode (auto-falls back if Apps Script is unreachable)
            </label>
          </div>

          {/* Reference Script Code */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Code2 className="w-3.5 h-3.5 text-blue-600" />
                Google Apps Script Reference Code
              </span>
              <button
                type="button"
                onClick={copyScript}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="text-[10px] bg-slate-900 text-slate-200 p-2.5 rounded-lg overflow-x-auto max-h-36 font-mono leading-relaxed">
              {sampleAppsScriptCode}
            </pre>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F2942] hover:bg-[#1A73E8] rounded-xl transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
