import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Participant } from '../types';
import { saveStoredParticipants, getStoredParticipants } from './apiService';

// Initialize Firebase App singleton safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider with all user-requested Google Drive scopes
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope('https://www.googleapis.com/auth/drive');
googleAuthProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
googleAuthProvider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
googleAuthProvider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token cache (NEVER in localStorage/sessionStorage per security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google OAuth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: unknown) {
    // If the user closed or cancelled the popup, handle gracefully without logging an error
    const errCode = (error as { code?: string })?.code;
    if (
      errCode === 'auth/popup-closed-by-user' ||
      errCode === 'auth/cancelled-popup-request'
    ) {
      return null;
    }
    console.warn('Google Sign In:', (error as Error)?.message || error);
    return null;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const googleLogout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  size?: string;
}

// In-memory cache of folder files to avoid re-fetching across participants
let cachedDriveFiles: DriveFileInfo[] = [];

/**
 * Robust participant file matcher supporting USN prefix, alphanumeric normalization, and name matching
 */
export function isFileMatchForParticipant(fileName: string, participant: Participant): boolean {
  const normFile = fileName.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const normUsn = participant.usn.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const normName = participant.fullName.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const firstName = participant.fullName.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (normFile.includes(normUsn)) return true;
  if (normName.length > 5 && normFile.includes(normName)) return true;
  if (firstName.length >= 3 && normFile.includes(firstName)) return true;

  return false;
}

/**
 * Fetch files directly from Google Drive API for a given folder ID
 */
export async function listFolderDriveFiles(
  folderId: string,
  token?: string
): Promise<{ files: DriveFileInfo[]; error?: string }> {
  const activeToken = token || cachedAccessToken;
  if (!activeToken) {
    return { files: [], error: 'Google Drive authorization token required. Please Sign in with Google.' };
  }

  try {
    const cleanFolderId = folderId.trim().replace(/['"\\]/g, '');
    const query = encodeURIComponent(`'${cleanFolderId}' in parents and trashed = false`);
    const fields = encodeURIComponent('files(id, name, mimeType, webViewLink, webContentLink, size, createdTime)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${activeToken}`,
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      return { files: [], error: `Google Drive API error (${response.status}): ${errText}` };
    }

    const data = await response.json();
    const files = data.files || [];
    cachedDriveFiles = files;
    return { files };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown network failure';
    return { files: [], error: `Failed to query Google Drive API: ${msg}` };
  }
}

/**
 * Synchronize Google Drive folder files with participants list by USN match
 */
export function matchDriveFilesToParticipants(
  participants: Participant[],
  driveFiles: DriveFileInfo[]
): { updatedParticipants: Participant[]; matchedCount: number } {
  let matchedCount = 0;

  const updatedParticipants = participants.map(participant => {
    const matchedFile = driveFiles.find(file => isFileMatchForParticipant(file.name, participant));

    if (matchedFile) {
      matchedCount++;
      const fileViewUrl =
        matchedFile.webViewLink || `https://drive.google.com/file/d/${matchedFile.id}/view?usp=sharing`;
      const filePreviewUrl = `https://drive.google.com/file/d/${matchedFile.id}/preview`;

      return {
        ...participant,
        certificateDriveUrl: fileViewUrl,
        certificatePreviewUrl: filePreviewUrl,
        certificateMatched: true
      };
    }

    return participant;
  });

  saveStoredParticipants(updatedParticipants);
  return { updatedParticipants, matchedCount };
}

/**
 * Find a specific participant's certificate file in Google Drive by USN or name
 */
export async function searchSingleParticipantCertificate(
  participant: Participant,
  folderId: string,
  token?: string
): Promise<{ file: DriveFileInfo | null; folderFiles: DriveFileInfo[]; error?: string }> {
  const activeToken = token || cachedAccessToken;
  if (!activeToken) {
    return { file: null, folderFiles: [], error: 'Google authentication required' };
  }

  try {
    const cleanFolderId = folderId.trim().replace(/['"\\]/g, '');
    const cleanUsn = participant.usn.trim();

    // 1. Check in-memory cached files first
    if (cachedDriveFiles.length > 0) {
      const cachedMatch = cachedDriveFiles.find(f => isFileMatchForParticipant(f.name, participant));
      if (cachedMatch) {
        return { file: cachedMatch, folderFiles: cachedDriveFiles };
      }
    }

    // 2. Query all files inside the shared folder
    const folderRes = await listFolderDriveFiles(cleanFolderId, activeToken);
    if (folderRes.files && folderRes.files.length > 0) {
      cachedDriveFiles = folderRes.files;
      const folderMatch = folderRes.files.find(f => isFileMatchForParticipant(f.name, participant));
      if (folderMatch) {
        return { file: folderMatch, folderFiles: folderRes.files };
      }
    }

    // 3. Fallback: Search across Drive by USN keyword
    const broadQuery = encodeURIComponent(`name contains '${cleanUsn}' and trashed = false`);
    const fields = encodeURIComponent('files(id, name, mimeType, webViewLink, webContentLink, size, createdTime)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${broadQuery}&fields=${fields}&pageSize=20&supportsAllDrives=true&includeItemsFromAllDrives=true`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${activeToken}`,
        Accept: 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const files: DriveFileInfo[] = data.files || [];
      if (files.length > 0) {
        const match = files.find(f => isFileMatchForParticipant(f.name, participant)) || files[0];
        return { file: match, folderFiles: cachedDriveFiles.length > 0 ? cachedDriveFiles : files };
      }
    }

    return { file: null, folderFiles: cachedDriveFiles };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return { file: null, folderFiles: cachedDriveFiles, error: msg };
  }
}

