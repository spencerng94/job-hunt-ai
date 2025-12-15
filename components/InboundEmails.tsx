import React, { useState, useMemo } from 'react';
import { InboundMessage, JobApplication, ApplicationStatus, ConnectedAccount } from '../types';
import { extractJobDetailsFromEmail } from '../services/geminiService';
import { Mail, RefreshCw, Inbox, CalendarClock, Trash2, Search, X, CheckCircle2, AtSign } from 'lucide-react';
import MessageViewer from './MessageViewer';
import CreateApplicationModal from './CreateApplicationModal';

interface InboundEmailsProps {
  emails: InboundMessage[]; 
  applications: JobApplication[];
  accounts: ConnectedAccount[];
  onLinkEmail: (email: InboundMessage, appId: string) => void;
  onUpdateAppStatus: (appId: string, status: ApplicationStatus) => void;
  onAddApplication: (app: JobApplication) => void;
  onDeleteMessage: (id: string) => void;
  onReply: (message: InboundMessage, body: string) => Promise<boolean>;
  isScanned: boolean;
  isScanning: boolean;
  onScan: (timeWindow: string) => void;
}

const InboundEmails: React.FC<InboundEmailsProps> = ({ 
  emails, 
  applications, 
  accounts,
  onLinkEmail, 
  onUpdateAppStatus, 
  onAddApplication,
  onDeleteMessage,
  onReply,
  isScanned,
  isScanning,
  onScan
}) => {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState<string>('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSender, setSelectedSender] = useState<string | null>(null);
  
  // Create Application Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isParsingEmail, setIsParsingEmail] = useState(false);
  const [draftApplication, setDraftApplication] = useState<Partial<JobApplication> | null>(null);

  // Extract unique senders for the filter chips
  const uniqueSenders = useMemo(() => {
    const senderMap = new Map<string, { email: string; name: string; count: number }>();
    
    emails.forEach(msg => {
      const email = msg.senderEmail;
      if (!email) return;
      
      if (!senderMap.has(email)) {
        senderMap.set(email, { email, name: msg.senderName, count: 0 });
      }
      senderMap.get(email)!.count++;
    });

    // Sort by frequency, then name
    return Array.from(senderMap.values()).sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
    });
  }, [emails]);

  // Filter messages based on search term AND selected sender
  const filteredMessages = useMemo(() => {
    let result = emails;

    // Filter by Sender
    if (selectedSender) {
        result = result.filter(msg => msg.senderEmail === selectedSender);
    }

    // Filter by Search
    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(msg => 
        (msg.senderName && msg.senderName.toLowerCase().includes(lowerTerm)) || 
        (msg.senderEmail && msg.senderEmail.toLowerCase().includes(lowerTerm))
      );
    }
    
    return result;
  }, [emails, searchTerm, selectedSender]);

  // Group messages by sender to create "chains"
  const groupedMessages = useMemo(() => {
    const groups: Record<string, InboundMessage[]> = {};
    filteredMessages.forEach(msg => {
      // Use senderEmail for Gmail, or senderName if email is missing
      const key = msg.senderEmail || msg.senderName;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(msg);
    });
    
    // Sort messages within groups by date desc
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
    });
    return groups;
  }, [filteredMessages]);

  // Get the list of senders sorted by most recent message
  const sortedSenders = useMemo(() => {
    return Object.keys(groupedMessages).sort((a, b) => {
      const dateA = new Date(groupedMessages[a][0].receivedAt).getTime();
      const dateB = new Date(groupedMessages[b][0].receivedAt).getTime();
      return dateB - dateA;
    });
  }, [groupedMessages]);

  // Handle viewing specific message
  const selectedMessage = useMemo(() => {
     return emails.find(e => e.id === selectedMessageId);
  }, [emails, selectedMessageId]);

  const handleCreateApplicationClick = async () => {
    if (!selectedMessage) return;

    setIsCreateModalOpen(true);
    setIsParsingEmail(true);

    try {
      const extracted = await extractJobDetailsFromEmail(selectedMessage.fullBody, selectedMessage.subject || '');
      
      setDraftApplication({
        companyName: extracted.companyName,
        roleTitle: extracted.roleTitle,
        jobLink: extracted.jobLink,
        status: extracted.status,
        nextInterviewDate: extracted.nextInterviewDate,
        dateApplied: new Date().toISOString(), // Default to today
        notes: [],
        recruiter: {
            name: selectedMessage.senderName,
            email: selectedMessage.senderEmail
        }
      });
    } catch (e) {
      console.error("Error extracting details", e);
      // Fallback draft
      setDraftApplication({
          companyName: '',
          roleTitle: '',
          status: ApplicationStatus.RECRUITER_SCREEN,
          dateApplied: new Date().toISOString(),
      });
    } finally {
      setIsParsingEmail(false);
    }
  };

  const handleFinalizeCreateApplication = (appData: Partial<JobApplication>) => {
    if (!selectedMessage) return;

    const newApp: JobApplication = {
      id: `app_gen_${Date.now()}`,
      dateApplied: new Date().toISOString(),
      companyName: appData.companyName || 'Unknown Company',
      roleTitle: appData.roleTitle || 'Unknown Role',
      jobLink: appData.jobLink || '',
      status: appData.status || ApplicationStatus.SUBMITTED,
      notes: appData.notes || [],
      recruiter: appData.recruiter,
      nextInterviewDate: appData.nextInterviewDate,
      ...appData
    } as JobApplication;

    // 1. Create App
    onAddApplication(newApp);
    // 2. Link current email to it
    onLinkEmail(selectedMessage, newApp.id);
    
    setIsCreateModalOpen(false);
    alert(`Application for ${newApp.companyName} created and linked!`);
  };

  if (!isScanned && emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
          <Inbox size={40} className="text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Scan Your Inbox</h2>
        <p className="text-slate-500 max-w-md mb-8">
          Connect your accounts to scan for recruiter emails and status updates automatically.
        </p>
        
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200 mb-6">
           <CalendarClock size={18} className="text-slate-500 ml-2" />
           <select 
             value={timeWindow} 
             onChange={(e) => setTimeWindow(e.target.value)}
             className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer outline-none"
           >
             <option value="7d">Last 7 Days</option>
             <option value="30d">Last 30 Days</option>
             <option value="3m">Last 3 Months</option>
           </select>
        </div>

        <button 
          onClick={() => onScan(timeWindow)}
          disabled={isScanning}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold shadow-md transition-all flex items-center gap-2"
        >
          {isScanning ? (
            <><RefreshCw className="animate-spin" size={20} /> Scanning...</>
          ) : (
            <><Mail size={20} /> Scan Now</>
          )}
        </button>
      </div>
    );
  }

  // If a full message is selected, show the Viewer
  if (selectedMessage) {
    return (
       <div className="h-[calc(100vh-8rem)]">
         <button 
           onClick={() => setSelectedMessageId(null)}
           className="mb-4 text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-medium transition"
         >
           &larr; Back to Inbox
         </button>
         <MessageViewer 
            message={selectedMessage} 
            onClose={() => setSelectedMessageId(null)} 
            onDelete={() => {
                onDeleteMessage(selectedMessage.id);
                setSelectedMessageId(null);
            }}
            onReply={onReply}
            applications={applications}
            onLinkApplication={(appId) => onLinkEmail(selectedMessage, appId)}
            onCreateApplication={handleCreateApplicationClick}
         />
         
         <CreateApplicationModal 
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={handleFinalizeCreateApplication}
            initialData={draftApplication}
            isLoading={isParsingEmail}
         />
       </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      {/* Left Sidebar: Message List */}
      <div className="w-full md:w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col">
        {/* Header & Filter */}
        <div className="flex flex-col border-b border-slate-200 bg-white">
            <div className="p-4 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-lg">Messages</h3>
                
                <div className="flex items-center gap-2">
                   {/* Time Window Selector (Mini) */}
                   <select 
                      value={timeWindow} 
                      onChange={(e) => setTimeWindow(e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-600 focus:outline-none focus:border-indigo-500"
                   >
                     <option value="7d">7 Days</option>
                     <option value="30d">30 Days</option>
                     <option value="3m">3 Months</option>
                   </select>

                   <button 
                      onClick={() => onScan(timeWindow)} 
                      className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50 transition" 
                      title="Rescan" 
                      disabled={isScanning}
                   >
                      <RefreshCw size={18} className={isScanning ? "animate-spin" : ""} />
                   </button>
                </div>
            </div>
            
            {/* Search Input */}
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Filter by sender name or email..." 
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Sender Filter Chips */}
            <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar mask-gradient">
                <button 
                    onClick={() => setSelectedSender(null)}
                    className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                        !selectedSender 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                >
                    All
                </button>
                {uniqueSenders.map(sender => (
                    <button 
                        key={sender.email}
                        onClick={() => setSelectedSender(selectedSender === sender.email ? null : sender.email)}
                        className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors border flex items-center gap-1 ${
                            selectedSender === sender.email
                            ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                        title={sender.email}
                    >
                        {sender.name || sender.email.split('@')[0]}
                        <span className={`text-[10px] py-0.5 px-1.5 rounded-full ${
                             selectedSender === sender.email ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                            {sender.count}
                        </span>
                    </button>
                ))}
            </div>
        </div>

        {/* Message List */}
        <div className="overflow-y-auto flex-1">
          {sortedSenders.length === 0 ? (
             <div className="p-8 text-center text-slate-400">
               {searchTerm || selectedSender ? (
                 <p>No messages matching your filters.</p>
               ) : (
                 <p>No messages found in the last {timeWindow === '3m' ? '3 Months' : timeWindow === '7d' ? '7 Days' : '30 Days'}.</p>
               )}
             </div>
          ) : (
             sortedSenders.map(senderKey => {
                const thread = groupedMessages[senderKey];
                const latest = thread[0];
                const account = accounts.find(a => a.id === latest.accountId);
                const isLinked = latest.linkedApplicationId || thread.some(m => !!m.linkedApplicationId);
                
                return (
                <div 
                    key={senderKey}
                    onClick={() => setSelectedMessageId(latest.id)}
                    className="p-4 border-b border-slate-100 cursor-pointer transition-colors hover:bg-white hover:shadow-sm group relative"
                >
                    <div className="flex justify-between items-start mb-1 pr-6">
                        <div className="flex flex-col min-w-0 pr-2 overflow-hidden">
                            <span className="font-semibold text-sm truncate text-slate-900 group-hover:text-indigo-700">
                                {latest.senderName}
                            </span>
                            {latest.senderEmail && (
                                <span className="text-[11px] text-slate-400 truncate">
                                    {latest.senderEmail}
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                            {new Date(latest.receivedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                    <div className="text-xs font-medium text-slate-700 mb-1 truncate pr-6 mt-1">{latest.subject || '(No Subject)'}</div>
                    <div className="text-xs text-slate-500 mb-2 truncate">{latest.snippet}</div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                         <span className="text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 bg-red-50 text-red-700 border-red-100">
                            <Mail size={10} />
                            Gmail
                         </span>

                         {account && (
                           <span className="text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 bg-slate-100 text-slate-500 border-slate-200 max-w-[140px] truncate" title={account.email}>
                              <AtSign size={10} />
                              {account.email}
                           </span>
                         )}

                         {thread.length > 1 && (
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">{thread.length} msgs</span>
                         )}

                         {isLinked && (
                            <span className="ml-auto text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200 flex items-center gap-1 font-medium">
                                <CheckCircle2 size={10} /> Linked
                            </span>
                         )}
                    </div>

                    {/* Delete Button - Appears on hover */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if(window.confirm('Are you sure you want to delete this message?')) {
                                onDeleteMessage(latest.id);
                                if (selectedMessageId === latest.id) setSelectedMessageId(null);
                            }
                        }}
                        className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                        title="Delete Message"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
                );
            })
          )}
        </div>
      </div>

      {/* Right Content: Quick Preview / Placeholder */}
      <div className="hidden md:flex flex-1 flex-col bg-slate-50/30 items-center justify-center text-slate-400">
          <div className="text-center max-w-sm px-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Inbox size={32} className="text-indigo-200" />
            </div>
            <h3 className="text-slate-800 font-semibold mb-2">Select a Message</h3>
            <p className="text-sm">Click on a message from the list to view the full content, raw source, and link it to an application.</p>
          </div>
      </div>
    </div>
  );
};

export default InboundEmails;