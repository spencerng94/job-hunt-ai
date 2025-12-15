export enum ApplicationStatus {
  SUBMITTED = 'Application Submitted',
  RECRUITER_SCREEN = 'Recruiter Screen',
  TECH_SCREEN = 'Technical Phone Screen',
  HIRING_MANAGER = 'Hiring Manager',
  ONSITE = 'Onsite',
  OFFER = 'Offer',
  REJECTED = 'Rejected',
  WITHDRAWN = 'Withdrawn'
}

export interface RecruiterInfo {
  name?: string;
  email?: string;
  phone?: string;
}

export interface Note {
  id: string;
  content: string;
  date: string;
}

export interface JobApplication {
  id: string;
  dateApplied: string;
  companyName: string;
  roleTitle: string;
  jobLink: string;
  status: ApplicationStatus;
  recruiter?: RecruiterInfo;
  notes: Note[];
  needsReview?: boolean; // Flag for AI suggestions
  nextInterviewDate?: string;
}

export type AccountProvider = 'Gmail';

export interface InboundMessage {
  id: string;
  accountId: string; // Linked to ConnectedAccount.id
  provider: AccountProvider;
  senderName: string;
  senderEmail?: string; // Nullable for LinkedIn
  subject?: string;     // Nullable for LinkedIn
  snippet: string;
  fullBody: string;     // HTML or Full Text
  rawContent: string;   // Raw Source/JSON
  receivedAt: string;
  link: string;
  isRead: boolean;
  linkedApplicationId?: string;
}

export interface ConnectedAccount {
  id: string;
  provider: AccountProvider;
  name: string; // User's name or account identifier
  email: string; // For Gmail: email address; For LinkedIn: primary email
  avatarUrl?: string;
  
  // Auth & Token Data (Simulated secure storage)
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt: number; // Timestamp
  
  // Sync Status
  status: 'Connected' | 'Disconnected' | 'Error' | 'Expired';
  lastSyncedAt: string;
  errorMessage?: string;
}

export interface DashboardStats {
  total: number;
  active: number;
  interviews: number;
  offers: number;
}

// Add Google GIS types
declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => {
            requestAccessToken: () => void;
          };
          revoke: (accessToken: string, done: () => void) => void;
        };
      };
    };
  }
}