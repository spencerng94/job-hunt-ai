import { InboundMessage } from '../types';

/**
 * Fetches relevant emails from Gmail API
 * Searches for keywords like 'interview', 'application', 'offer' to filter noise.
 */
export const fetchGmailMessages = async (accessToken: string, accountId: string, limit: number = 5): Promise<InboundMessage[]> => {
  if (accessToken.startsWith('mock_')) {
    return []; // Skip for mock accounts
  }

  try {
    // 1. Search for messages
    const query = 'subject:(interview OR application OR offer OR schedule) -category:promotions -category:social';
    
    const listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${limit}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    
    if (!listResponse.ok) {
        let errorData;
        try {
            errorData = await listResponse.json();
        } catch (e) {
            // If json parse fails, use text fallback in the error message
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
    
    for (const msg of listData.messages) {
      const detailResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      if (detailResponse.ok) {
        const data = await detailResponse.json();
        const parsed = parseGmailMessage(data, accountId);
        if (parsed) messages.push(parsed);
      } else {
        console.warn(`Failed to fetch details for message ${msg.id}`);
      }
    }

    return messages;
  } catch (error) {
    console.error("Gmail Fetch Service Error:", error);
    throw error; // Re-throw to be caught by UI
  }
};

const parseGmailMessage = (data: any, accountId: string): InboundMessage | null => {
  try {
    const headers = data.payload.headers;
    const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const subject = getHeader('Subject');
    const from = getHeader('From');
    
    // Parse Sender
    // Format usually: "Name <email@example.com>" or "email@example.com"
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
    // Gmail API payload parts can be nested
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