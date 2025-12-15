import { ConnectedAccount, AccountProvider } from '../types';

/**
 * Authentication Service
 * 
 * Supports two modes:
 * 1. REAL MODE: Requires a Google Client ID in .env file or LocalStorage.
 *    Uses Google Identity Services (GIS) for actual OAuth flow.
 * 2. MOCK MODE: Default if no Client ID is found.
 *    Simulates the experience for testing/demo purposes.
 */

// Helper to safely access environment variables (Vite preferred)
export const getGoogleClientId = (): string | undefined => {
  // 0. Manual Override (LocalStorage) - Allows users to paste ID in UI if env vars fail
  if (typeof window !== 'undefined' && window.localStorage) {
    const manualId = localStorage.getItem('jh_google_client_id');
    if (manualId) return manualId;
  }

  // 1. Try Vite (import.meta.env) - Primary Method
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      // @ts-ignore
      return import.meta.env.VITE_GOOGLE_CLIENT_ID;
    }
  } catch (e) {
    // Ignore errors if import.meta is not supported
  }

  return undefined;
};

const GOOGLE_CLIENT_ID = getGoogleClientId();

// Scopes needed for the app - Gmail Readonly is critical for scanning
const GMAIL_SCOPES = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

export const connectAccount = async (provider: AccountProvider): Promise<ConnectedAccount> => {
  const currentClientId = getGoogleClientId(); // specific check at runtime
  
  if (provider === 'Gmail' && currentClientId) {
    return connectRealGoogleAccount(currentClientId);
  }
  
  // LinkedIn API requires server-side OAuth (Client Secret cannot be exposed).
  // We strictly simulate LinkedIn in this frontend-only demo.
  return connectMockAccount(provider);
};

// --- REAL GOOGLE OAUTH IMPLEMENTATION ---

const connectRealGoogleAccount = (clientId: string): Promise<ConnectedAccount> => {
  return new Promise((resolve, reject) => {
    try {
      if (!window.google) {
        // Retry once if script hasn't loaded yet
        setTimeout(() => {
             if (!window.google) reject(new Error("Google Identity Services script not loaded. Check your internet connection."));
             else initiateAuth(clientId, resolve, reject);
        }, 1000);
        return;
      }
      initiateAuth(clientId, resolve, reject);
    } catch (error) {
      console.error("OAuth Initialization Error:", error);
      // Fallback to mock if critical failure, or reject
      reject(error);
    }
  });
};

const initiateAuth = (clientId: string, resolve: (val: ConnectedAccount) => void, reject: (reason: any) => void) => {
    const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GMAIL_SCOPES,
        prompt: 'consent', // Force re-consent to ensure scopes are granted and avoid 403 errors
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            console.error("Token Error:", tokenResponse);
            reject(tokenResponse.error);
            return;
          }

          if (!tokenResponse.access_token) {
             reject(new Error("No access token received from Google."));
             return;
          }

          // Token received, now fetch user profile
          try {
            const profile = await fetchUserProfile(tokenResponse.access_token);
            
            const newAccount: ConnectedAccount = {
              id: `acc_gmail_${Date.now()}`, // Unique ID for this session
              provider: 'Gmail',
              name: profile.name,
              email: profile.email,
              avatarUrl: profile.picture,
              accessToken: tokenResponse.access_token,
              tokenExpiresAt: Date.now() + (tokenResponse.expires_in * 1000),
              status: 'Connected',
              lastSyncedAt: new Date().toISOString()
            };
            
            resolve(newAccount);
          } catch (err) {
            console.error("Profile Fetch Error:", err);
            reject("Failed to fetch user profile after auth.");
          }
        },
      });

      // Trigger the popup
      client.requestAccessToken();
}

const fetchUserProfile = async (accessToken: string) => {
  const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }
  return response.json();
};

// --- MOCK IMPLEMENTATION ---

const connectMockAccount = async (provider: AccountProvider): Promise<ConnectedAccount> => {
  return new Promise((resolve) => {
    // Simulate network delay and user interaction time (popup duration)
    const delay = provider === 'LinkedIn' ? 1500 : 1000;
    
    setTimeout(() => {
      const id = `acc_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();
      const expiresAt = Date.now() + 3600 * 1000; // 1 hour from now

      if (provider === 'Gmail') {
        const randId = Math.floor(Math.random() * 1000);
        resolve({
          id,
          provider: 'Gmail',
          name: 'Demo User (Mock)',
          email: `demo.user.${randId}@gmail.com`,
          avatarUrl: `https://ui-avatars.com/api/?name=Demo+User&background=EA4335&color=fff`,
          accessToken: `mock_token_${randId}`,
          tokenExpiresAt: expiresAt,
          status: 'Connected',
          lastSyncedAt: timestamp
        });
      } else {
        const randId = Math.floor(Math.random() * 1000);
        resolve({
          id,
          provider: 'LinkedIn',
          name: 'Demo User (Mock)',
          email: `demo.user.${randId}@linkedin.com`,
          avatarUrl: `https://ui-avatars.com/api/?name=Demo+User&background=0077b5&color=fff`,
          accessToken: `mock_token_${randId}`,
          tokenExpiresAt: expiresAt,
          status: 'Connected',
          lastSyncedAt: timestamp
        });
      }
    }, delay);
  });
};

// --- SYNC FUNCTIONALITY ---

export const syncAccountData = async (account: ConnectedAccount): Promise<ConnectedAccount> => {
  // Real implementation would check token expiry and refresh if needed
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...account,
        lastSyncedAt: new Date().toISOString(),
        status: 'Connected'
      });
    }, 1500);
  });
};