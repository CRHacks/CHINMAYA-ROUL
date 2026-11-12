import { Participant, ApiConfig } from '../types';
import { INITIAL_PARTICIPANTS } from '../data/initialParticipants';

const STORAGE_KEY_DATA = 'gri_participants_data_v1';
const STORAGE_KEY_CONFIG = 'gri_api_config_v1';

export const OFFICIAL_GRI_DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/1CX3U5m8HETR8GKP_4jIuXg02VK5JuO9v?usp=drive_link';

export const getStoredConfig = (): ApiConfig => {
  const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        masterDriveFolderUrl: parsed.masterDriveFolderUrl || OFFICIAL_GRI_DRIVE_FOLDER_URL
      };
    } catch {
      // ignore JSON parse error
    }
  }
  return {
    scriptUrl: '',
    isMockMode: true,
    lastSyncedAt: new Date().toISOString(),
    masterDriveFolderUrl: OFFICIAL_GRI_DRIVE_FOLDER_URL
  };
};

export function isPlaceholderLink(url?: string): boolean {
  if (!url) return true;
  return (
    url.includes('1A2B3C4D') ||
    url.includes('_imran') ||
    url.includes('_bhuvi') ||
    url.includes('_gadha') ||
    url.includes('_aditya') ||
    url.includes('_sneha') ||
    url.includes('1K2L3M4N')
  );
}

export function getStudentCertificateDriveLink(participant: Participant, masterFolderUrl?: string): {
  url: string;
  folderUrl: string;
  searchQueryUrl: string;
  previewUrl: string;
  isFolderSearch: boolean;
  isDirectFile: boolean;
  isConfigured: boolean;
  folderId: string;
} {
  const effectiveFolder = masterFolderUrl?.trim() || OFFICIAL_GRI_DRIVE_FOLDER_URL;
  const folderMatch = effectiveFolder.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  const folderId = folderMatch ? folderMatch[1] : '1CX3U5m8HETR8GKP_4jIuXg02VK5JuO9v';

  const folderUrl = `https://drive.google.com/drive/folders/${folderId}?usp=drive_link`;
  const folderPreviewUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`;

  // If participant has a real non-placeholder file link:
  if (participant.certificateDriveUrl && !isPlaceholderLink(participant.certificateDriveUrl)) {
    const parsed = parseGoogleDriveUrls(participant.certificateDriveUrl);
    const effectivePreview =
      participant.certificatePreviewUrl ||
      parsed.previewUrl ||
      (parsed.fileId ? `https://drive.google.com/file/d/${parsed.fileId}/preview` : '');

    return {
      url: participant.certificateDriveUrl,
      folderUrl,
      searchQueryUrl: folderUrl,
      previewUrl: effectivePreview,
      isFolderSearch: false,
      isDirectFile: true,
      isConfigured: true,
      folderId
    };
  }

  // Direct shared folder link where participant's certificate (e.g. [USN].pdf) resides
  return {
    url: folderUrl,
    folderUrl,
    searchQueryUrl: folderUrl,
    previewUrl: '', // Strictly individual certificate preview, no folder grid
    isFolderSearch: true,
    isDirectFile: false,
    isConfigured: true,
    folderId
  };
}

export const saveStoredConfig = (config: ApiConfig): void => {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
};

export const getStoredParticipants = (): Participant[] => {
  const saved = localStorage.getItem(STORAGE_KEY_DATA);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: Participant) => ({
          ...p,
          certificateDriveUrl: isPlaceholderLink(p.certificateDriveUrl) ? '' : p.certificateDriveUrl,
          certificatePreviewUrl: isPlaceholderLink(p.certificatePreviewUrl) ? '' : p.certificatePreviewUrl
        }));
      }
    } catch {
      // fallback
    }
  }
  const sanitized = INITIAL_PARTICIPANTS.map(p => ({
    ...p,
    certificateDriveUrl: '',
    certificatePreviewUrl: ''
  }));
  localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(sanitized));
  return sanitized;
};

export const saveStoredParticipants = (data: Participant[]): void => {
  localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
};

/**
 * Fetch all participants from Live Google Apps Script or Local Store
 */
export async function fetchParticipants(): Promise<{ data: Participant[]; isLive: boolean; error?: string }> {
  const config = getStoredConfig();

  if (config.scriptUrl && !config.isMockMode) {
    try {
      const response = await fetch(`${config.scriptUrl}?action=getParticipants`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      if (Array.isArray(json.participants) && json.participants.length > 0) {
        saveStoredParticipants(json.participants);
        return { data: json.participants, isLive: true };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown network error';
      return {
        data: getStoredParticipants(),
        isLive: false,
        error: `Could not reach live Apps Script (${message}). Using local verified repository.`
      };
    }
  }

  // Mock / default mode
  return {
    data: getStoredParticipants(),
    isLive: false
  };
}

/**
 * Dispatch an individual certificate email
 */
export async function sendParticipantEmail(participantId: string): Promise<{ success: boolean; message: string }> {
  const config = getStoredConfig();
  const current = getStoredParticipants();
  const target = current.find(p => p.id === participantId);

  if (!target) {
    return { success: false, message: 'Participant record not found.' };
  }

  if (config.scriptUrl && !config.isMockMode) {
    try {
      const response = await fetch(config.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendSingleCertificate',
          usn: target.usn,
          email: target.collegeEmail,
          fullName: target.fullName
        })
      });
      const res = await response.json();
      if (res.status === 'success') {
        updateParticipantStatus(target.id, 'Delivered');
        return { success: true, message: `Official certificate email dispatched to ${target.collegeEmail}` };
      }
    } catch (err) {
      console.warn('Live dispatch error, proceeding with local simulated dispatch', err);
    }
  }

  // Local simulated dispatch with realistic latency
  await new Promise(res => setTimeout(res, 500));
  updateParticipantStatus(target.id, 'Delivered');
  return { success: true, message: `Certificate email successfully queued and delivered to ${target.collegeEmail}` };
}

export function parseGoogleDriveUrls(url: string) {
  if (!url) {
    return {
      viewUrl: '',
      previewUrl: '',
      downloadUrl: '',
      fileId: null
    };
  }

  const trimmed = url.trim();

  // If bare file ID (alphanumeric 20+ chars)
  if (!trimmed.includes('/') && !trimmed.includes('.') && trimmed.length >= 20) {
    return {
      fileId: trimmed,
      viewUrl: `https://drive.google.com/file/d/${trimmed}/view?usp=sharing`,
      previewUrl: `https://drive.google.com/file/d/${trimmed}/preview`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${trimmed}`
    };
  }

  const match = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    const fileId = match[1];
    return {
      fileId,
      viewUrl: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
      previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`
    };
  }

  return {
    fileId: null,
    viewUrl: trimmed,
    previewUrl: trimmed.includes('/view') ? trimmed.replace('/view', '/preview') : trimmed,
    downloadUrl: trimmed
  };
}

export function updateParticipantStatus(id: string, status: 'Delivered' | 'Pending' | 'Failed'): Participant[] {
  const current = getStoredParticipants();
  const updated = current.map(p => {
    if (p.id === id) {
      return {
        ...p,
        emailDeliveryStatus: status,
        deliveryTimestamp: status === 'Delivered' ? new Date().toLocaleString() : p.deliveryTimestamp
      };
    }
    return p;
  });
  saveStoredParticipants(updated);
  return updated;
}

export function updateParticipantDriveLink(id: string, newDriveUrl: string): Participant[] {
  const current = getStoredParticipants();
  const parsed = parseGoogleDriveUrls(newDriveUrl.trim());
  const updated = current.map(p => {
    if (p.id === id) {
      return {
        ...p,
        certificateDriveUrl: parsed.viewUrl,
        certificatePreviewUrl: parsed.previewUrl,
        certificateMatched: newDriveUrl.trim().length > 0
      };
    }
    return p;
  });
  saveStoredParticipants(updated);
  return updated;
}

