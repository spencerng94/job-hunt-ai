import React, { useState } from 'react';
import { InboundMessage, JobApplication } from '../types';
import { X, Code, FileText, Link as LinkIcon, Calendar, User, Building2, Trash2, PlusCircle, Reply, Send, Loader2 } from 'lucide-react';
import { STATUS_COLORS } from '../constants';

interface MessageViewerProps {
  message: InboundMessage;
  onClose: () => void;
  onDelete: () => void;
  onReply: (message: InboundMessage, body: string) => Promise<boolean>;
  applications: JobApplication[];
  onLinkApplication: (appId: string) => void;
  onCreateApplication: () => void;
  currentAccountEmail?: string;
}

const MessageViewer: React.FC<MessageViewerProps> = ({ 
  message, 
  onClose, 
  onDelete, 
  onReply, 
  applications, 
  onLinkApplication, 
  onCreateApplication,
  currentAccountEmail
}) => {
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');
  const [isLinkMode, setIsLinkMode] = useState(false);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Simple keyword highlighting for formatted view
  const highlightKeywords = (html: string) => {
    const keywords = ['interview', 'onsite', 'screen', 'schedule', 'offer', 'technical'];
    let processed = html;
    keywords.forEach(kw => {
      const regex = new RegExp(`(${kw})`, 'gi');
      processed = processed.replace(regex, '<span class="bg-yellow-200 text-yellow-900 px-1 rounded font-semibold">$1</span>');
    });
    return processed;
  };

  const handleSendReply = async () => {
    if (!replyBody.trim()) return;
    
    setIsSendingReply(true);
    const success = await onReply(message, replyBody);
    setIsSendingReply(false);
    
    if (success) {
        setReplyBody('');
        setIsReplyOpen(false);
        alert('Reply Sent Successfully!');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-fade-in relative z-20">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
        <div className="flex-1 mr-4">
          <h2 className="text-xl font-bold text-slate-800 leading-tight mb-2">
            {message.subject || 'No Subject'}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1.5 font-medium text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
              <User size={14} className="text-indigo-500" />
              {message.senderName}
            </span>
            {message.senderEmail && (
              <span className="text-slate-400">&lt;{message.senderEmail}&gt;</span>
            )}
            <span className="flex items-center gap-1.5 ml-auto sm:ml-0">
              <Calendar size={14} className="text-slate-400" />
              {new Date(message.receivedAt).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => {
                if(window.confirm("Delete this message?")) {
                    onDelete();
                }
             }}
             className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
             title="Delete"
           >
            <Trash2 size={20} />
           </button>
           <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-2 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setViewMode('formatted')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${viewMode === 'formatted' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <FileText size={14} /> Formatted
          </button>
          <button 
            onClick={() => setViewMode('raw')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${viewMode === 'raw' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Code size={14} /> Raw Source
          </button>
        </div>

        <div className="flex items-center gap-2">
           {/* Reply Button Toggle */}
           <button 
                onClick={() => setIsReplyOpen(!isReplyOpen)}
                className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md transition font-medium border ${
                    isReplyOpen 
                    ? 'bg-slate-800 text-white border-slate-800' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
            >
                <Reply size={14} /> Reply
           </button>

          {!message.linkedApplicationId && (
              <button 
                onClick={onCreateApplication}
                className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 px-3 py-1.5 rounded-md transition font-medium"
              >
                <PlusCircle size={14} /> Create Application
              </button>
           )}

           <div className="relative">
             {message.linkedApplicationId ? (
               <div className="flex items-center gap-2 text-sm text-green-600 font-medium px-3 py-1.5 bg-green-50 rounded-md">
                 <LinkIcon size={14} /> Linked to Application
               </div>
             ) : (
               <button 
                  onClick={() => setIsLinkMode(!isLinkMode)}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 px-3 py-1.5 hover:bg-indigo-50 rounded-md transition border border-transparent hover:border-indigo-100"
                >
                  <LinkIcon size={14} /> Link Existing
                </button>
             )}
             
             {isLinkMode && (
               <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50">
                 <div className="text-xs font-bold text-slate-400 px-2 py-1 uppercase tracking-wider mb-1">Select Application</div>
                 <div className="max-h-60 overflow-y-auto space-y-1">
                   {applications.map(app => (
                     <button 
                       key={app.id}
                       onClick={() => {
                         onLinkApplication(app.id);
                         setIsLinkMode(false);
                       }}
                       className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 transition flex items-start gap-3 group"
                     >
                       <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 shrink-0 mt-0.5">
                         <Building2 size={16} />
                       </div>
                       <div>
                         <div className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">{app.companyName}</div>
                         <div className="text-xs text-slate-500">{app.roleTitle}</div>
                       </div>
                     </button>
                   ))}
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Body Content & Reply Section */}
      <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col">
        {/* Email Content */}
        <div className="p-8 bg-white shadow-sm mb-4">
            {viewMode === 'formatted' ? (
            <div 
                className="prose prose-slate max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: highlightKeywords(message.fullBody) }} 
            />
            ) : (
            <pre className="text-xs font-mono text-slate-600 bg-slate-50 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap border border-slate-200">
                {message.rawContent}
            </pre>
            )}
        </div>

        {/* Inline Reply Editor */}
        {isReplyOpen && (
            <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sticky bottom-0 z-10 animate-fade-in-up">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-600">Reply to {message.senderName}</span>
                        {currentAccountEmail && (
                            <span className="text-xs text-slate-400">Sending as: {currentAccountEmail}</span>
                        )}
                    </div>
                    <button onClick={() => setIsReplyOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
                </div>
                <textarea 
                    autoFocus
                    className="w-full p-3 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[120px] mb-3 resize-none"
                    placeholder="Type your reply..."
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                    <button 
                        onClick={() => setIsReplyOpen(false)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                    >
                        Discard
                    </button>
                    <button 
                        onClick={handleSendReply}
                        disabled={isSendingReply || !replyBody.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                    >
                        {isSendingReply ? (
                            <><Loader2 size={16} className="animate-spin" /> Sending...</>
                        ) : (
                            <><Send size={16} /> Send Reply</>
                        )}
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Footer Context */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-400 flex justify-between items-center">
         <span>Message ID: {message.id}</span>
         <span>Provider: {message.provider}</span>
      </div>
    </div>
  );
};

export default MessageViewer;