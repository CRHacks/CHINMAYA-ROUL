export interface Participant {
  id: string;
  slNo: number;
  fullName: string;
  usn: string;
  collegeEmail: string;
  department: string;
  certificateDriveUrl: string;
  certificatePreviewUrl: string;
  certificateMatched: boolean;
  emailDeliveryStatus: 'Delivered' | 'Pending' | 'Failed';
  deliveryTimestamp?: string;
  verifiedAt?: string;
}

export interface ApiConfig {
  scriptUrl: string;
  isMockMode: boolean;
  lastSyncedAt?: string;
  masterDriveFolderUrl?: string;
}

export type ActiveView = 'student' | 'admin';
