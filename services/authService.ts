import { ConnectedAccount, AccountProvider } from '../types';

/**
 * Simulates an OAuth authentication flow.
 * In a real app, this would redirect to the provider's OAuth URL, handle the callback,
 * exchange the code for tokens, and store them securely on the backend.
 */

const generateMockToken = () => Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

export const connectAccount = async (provider: AccountProvider): Promise<ConnectedAccount> => {
  return new Promise((resolve) => {
    // Simulate network delay and user interaction time
    setTimeout(() => {
      const id = `acc_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();
      const expiresAt = Date.now() + 3600 * 1000; // 1 hour from now

      if (provider === 'Gmail') {
        resolve({
          id,
          provider: 'Gmail',
          name: 'Alex Developer',
          email: `alex.dev.${Math.floor(Math.random() * 100)}@gmail.com`,
          avatarUrl: `https://ui-avatars.com/api/?name=Alex+Dev&background=EA4335&color=fff`,
          accessToken: generateMockToken(),
          refreshToken: generateMockToken(),
          tokenExpiresAt: expiresAt,
          status: 'Connected',
          lastSyncedAt: timestamp
        });
      } else {
        resolve({
          id,
          provider: 'LinkedIn',
          name: 'Alex Developer',
          email: `alex.pro.${Math.floor(Math.random() * 100)}@linkedin.com`,
          avatarUrl: `https://ui-avatars.com/api/?name=Alex+Pro&background=0077b5&color=fff`,
          accessToken: generateMockToken(),
          refreshToken: generateMockToken(),
          tokenExpiresAt: expiresAt,
          status: 'Connected',
          lastSyncedAt: timestamp
        });
      }
    }, 2000); // 2 second simulated delay
  });
};

export const syncAccountData = async (account: ConnectedAccount): Promise<ConnectedAccount> => {
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
