import React, { useState, useMemo, useEffect } from 'react';
import { InboundMessage, JobApplication, ApplicationStatus } from '../types';
import { analyzeEmailWithGemini, EmailAnalysisResult } from '../services/geminiService';
import { Mail, Sparkles, Link as LinkIcon, AlertCircle, RefreshCw, Inbox, Clock, Calendar, CheckCircle2, Building2, Linkedin } from 'lucide-react';
import { STATUS_COLORS } from '../constants';
import MessageViewer from './MessageViewer';

interface InboundEmailsProps {
  emails: InboundMessage[]; // Renamed from emails to messages conceptually, but prop name kept for compatibility with parent
  applications: JobApplication[];
  onLinkEmail: (email: InboundMessage, appId: string) => void;
  onUpdateAppStatus: (appId: string, status: ApplicationStatus) => void;
  isScanned: boolean;
  isScanning: boolean;
  onScan: () => void;
}

const InboundEmails: React.FC<InboundEmailsProps> = ({ 
  emails, 
  applications, 
  onLinkEmail, 
  onUpdateAppStatus,
  isScanned,
  isScanning,
  onScan
}) => {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Gmail' | 'LinkedIn'>('All');
  
  // Analysis State
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<Record<string, EmailAnalysisResult>>({});

  // Filter messages based on provider
  const filteredMessages = useMemo(() => {
    if (activeFilter === 'All') return emails;
    return emails.filter(msg => msg.provider === activeFilter);
  }, [emails, activeFilter]);

  // Group messages by sender to create "chains"
  const groupedMessages = useMemo(() => {
    const groups: Record<string, InboundMessage[]> = {};
    filteredMessages.forEach(msg => {
      // Use senderEmail for Gmail, or senderName for LinkedIn/others if email is missing
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

  const handleAnalyze = async (message: InboundMessage) => {
    setAnalyzingId(message.id);
    const result = await analyzeEmailWithGemini(message.snippet, message.subject || 'No Subject');
    setAnalysisResult(prev => ({
      ...prev,
      [message.id]: result
    }));
    setAnalyzingId(null);
  };

  if (!isScanned && emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
          <Inbox size={40} className="text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Scan Your Inbox</h2>
        <p className="text-slate-500 max-w-md mb-8">
          Connect your accounts to scan for recruiter emails, LinkedIn messages, and status updates automatically.
        </p>
        <button 
          onClick={onScan}
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
            applications={applications}
            onLinkApplication={(appId) => onLinkEmail(selectedMessage, appId)}
         />
       </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      {/* Left Sidebar: Message List */}
      <div className="w-full md:w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col">
        {/* Header & Filter Tabs */}
        <div className="flex flex-col border-b border-slate-200 bg-white">
            <div className="p-4 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-lg">Messages</h3>
                <button onClick={onScan} className="text-slate-400 hover:text-indigo-600" title="Rescan" disabled={isScanning}>
                    <RefreshCw size={18} className={isScanning ? "animate-spin" : ""} />
                </button>
            </div>
            <div className="flex px-4 gap-4">
                {(['All', 'Gmail', 'LinkedIn'] as const).map(filter => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`pb-3 text-sm font-medium border-b-2 transition ${
                            activeFilter === filter 
                                ? 'border-indigo-600 text-indigo-600' 
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>
        </div>

        {/* Message List */}
        <div className="overflow-y-auto flex-1">
          {sortedSenders.length === 0 ? (
             <div className="p-8 text-center text-slate-400">
               <p>No messages found.</p>
             </div>
          ) : (
             sortedSenders.map(senderKey => {
                const thread = groupedMessages[senderKey];
                const latest = thread[0];
                
                return (
                <div 
                    key={senderKey}
                    onClick={() => setSelectedMessageId(latest.id)}
                    className="p-4 border-b border-slate-100 cursor-pointer transition-colors hover:bg-white hover:shadow-sm group"
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm truncate pr-2 text-slate-900 group-hover:text-indigo-700">
                            {latest.senderName}
                        </span>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                            {new Date(latest.receivedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                    <div className="text-xs font-medium text-slate-700 mb-1 truncate">{latest.subject || '(No Subject)'}</div>
                    <div className="text-xs text-slate-500 mb-2 truncate">{latest.snippet}</div>
                    
                    <div className="flex items-center gap-2">
                         <span className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                            latest.provider === 'Gmail' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                         }`}>
                            {latest.provider === 'Gmail' ? <Mail size={10} /> : <Linkedin size={10} />}
                            {latest.provider}
                         </span>
                         {thread.length > 1 && (
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">{thread.length} msgs</span>
                         )}
                    </div>
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