import { InboundMessage } from '../types';

/**
 * Fetches relevant emails from Gmail API
 * Updated with robust queries to catch recruiter outreach and support time windows.
 */
export const fetchGmailMessages = async (
  accessToken: string, 
  accountId: string, 
  limit: number = 20, // Increased default limit to account for broader search
  timeWindow: string = '30d' // '7d', '30d', '3m'
): Promise<InboundMessage[]> => {
  if (accessToken.startsWith('mock_')) {
    return []; // Skip for mock accounts
  }

  try {
    // Convert UI time window to Gmail API format
    let newerThan = '30d';
    if (timeWindow === '7d') newerThan = '7d';
    if (timeWindow === '3m') newerThan = '90d';

    // BROADENED SEARCH STRATEGY:
    // 1. Subject Keywords: Standard interview/offer terms.
    // 2. Body Keywords: Phrases recruiters use ("impressed by your", "found your profile").
    // 3. Removed 'category:promotions' exclusion because automated recruiter emails (Wellfound, Hired, etc.) often land there.
    
    const subjectTerms = 'subject:(interview OR application OR offer OR schedule OR hiring OR opportunity OR "quick chat" OR role)';
    const bodyTerms = '("join our team" OR "hiring" OR "found your profile" OR "impressed by your" OR "talent" OR "recruiter" OR "wellfound" OR "angellist")';
    
    // Combine queries: (Subject Matches OR Body Matches) AND Newer Than X
    const query = `(${subjectTerms} OR ${bodyTerms}) newer_than:${newerThan}`;
    
    console.log("Executing Gmail Query:", query);

    const listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${limit}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    
    if (!listResponse.ok) {
        let errorData;
        try {
            errorData = await listResponse.json();
        } catch (e) {
            throw new Error(`Gmail API Error: ${listResponse.status} ${listResponse.statusText}`);
        }

        console.error("Gmail API Error:", errorData);
        const message = errorData.error?.message || JSON.stringify(errorData);
        
        if (listResponse.status === 403) {
            if (message.includes("Insufficient Permission") || message.includes("scope")) {
                throw new Error("Gmail permission not granted. Please re-connect your Google account.");
            }
            if (message.includes("not enabled") || message.includes("project")) {
                throw new Error("Gmail API is not enabled for this project.");
            }
        }
        
        if (listResponse.status === 401) {
             throw new Error("Access token expired. Please re-connect.");
        }

        throw new Error(`Failed to list messages: ${message}`);
    }

    const listData = await listResponse.json();
    
    if (!listData.messages || listData.messages.length === 0) {
        console.log("No messages found matching query.");
        return [];
    }

    // 2. Fetch full details for each message
    const messages: InboundMessage[] = [];
    
    // Process in parallel chunks to speed up loading
    const fetchDetails = async (msg: any) => {
      try {
        const detailResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        
        if (detailResponse.ok) {
          const data = await detailResponse.json();
          const parsed = parseGmailMessage(data, accountId);
          if (parsed) return parsed;
        }
      } catch (e) {
        console.warn(`Failed to fetch details for message ${msg.id}`);
      }
      return null;
    };

    const results = await Promise.all(listData.messages.map(fetchDetails));
    return results.filter((m): m is InboundMessage => m !== null);

  } catch (error) {
    console.error("Gmail Fetch Service Error:", error);
    throw error; // Re-throw to be caught by UI
  }
};

/**
 * Moves a message to the trash
 */
export const trashGmailMessage = async (accessToken: string, messageId: string): Promise<boolean> => {
  if (accessToken.startsWith('mock_')) return true;

  try {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!response.ok) {
      console.error("Failed to trash message", await response.json());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Gmail Trash Error:", error);
    return false;
  }
};

const parseGmailMessage = (data: any, accountId: string): InboundMessage | null => {
  try {
    const headers = data.payload.headers;
    const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const subject = getHeader('Subject');
    const from = getHeader('From');
    
    // Parse Sender
    let senderName = from;
    let senderEmail = from;
    const match = from.match(/(.*)<(.*)>/);
    if (match) {
      senderName = match[1].trim().replace(/^"|"$/g, '');
      senderEmail = match[2].trim();
    }

    // Decode Body
    let body = data.snippet; // Default to snippet
    let rawContent = JSON.stringify(data.payload, null, 2);
    
    // Attempt to find HTML part
    const findPart = (parts: any[], mimeType: string): any => {
      if (!parts) return null;
      for (const part of parts) {
        if (part.mimeType === mimeType) return part;
        if (part.parts) {
          const found = findPart(part.parts, mimeType);
          if (found) return found;
        }
      }
      return null;
    };

    const htmlPart = findPart(data.payload.parts, 'text/html');
    const textPart = findPart(data.payload.parts, 'text/plain');
    
    const bodyPart = htmlPart || textPart;
    if (bodyPart && bodyPart.body && bodyPart.body.data) {
      // Body is base64url encoded
      body = atob(bodyPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    }

    return {
      id: data.id,
      accountId,
      provider: 'Gmail',
      senderName: senderName || 'Unknown',
      senderEmail: senderEmail || '',
      subject: subject || '(No Subject)',
      snippet: data.snippet,
      fullBody: body,
      rawContent: rawContent,
      receivedAt: new Date(parseInt(data.internalDate)).toISOString(),
      link: `https://mail.google.com/mail/u/0/#inbox/${data.id}`,
      isRead: !data.labelIds.includes('UNREAD')
    };
  } catch (e) {
    console.warn("Failed to parse message", data.id, e);
    return null;
  }
};