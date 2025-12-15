import React, { useState } from 'react';
import { ConnectedAccount } from '../types';
import { Mail, Linkedin, Globe, Trash2, RefreshCw, Plus, CheckCircle2, AlertCircle, ShieldCheck, ExternalLink, Clock } from 'lucide-react';
import ConnectAccountModal from './ConnectAccountModal';

interface AccountsManagerProps {
  accounts: ConnectedAccount[];
  onAddAccount: (account: ConnectedAccount) => void;
  onRemoveAccount: (id: string) => void;
  onSyncAccount: (id: string) => void;
}

const AccountsManager: React.FC<AccountsManagerProps> = ({ accounts, onAddAccount, onRemoveAccount, onSyncAccount }) => {
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSync = (id: string) => {
    setSyncingId(id);
    onSyncAccount(id);
    setTimeout(() => {
      setSyncingId(null);
    }, 2000);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Gmail': return <Mail className="text-red-500" size={24} />;
      case 'LinkedIn': return <Linkedin className="text-blue-600" size={24} />;
      default: return <Globe className="text-slate-500" size={24} />;
    }
  };

  const formatLastSynced = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Connected Accounts</h2>
           <p className="text-slate-500">Manage the sources JobHunt scans for applications and recruiter messages.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2"
        >
          <Plus size={18} /> Connect Account
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {accounts.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
               <Globe size={32} />
             </div>
             <h3 className="font-bold text-slate-800 mb-2">No Accounts Connected</h3>
             <p className="text-slate-500 mb-6 max-w-sm mx-auto">Connect your Gmail or LinkedIn account to start tracking applications automatically.</p>
             <button 
                onClick={() => setIsModalOpen(true)}
                className="text-indigo-600 font-semibold hover:underline"
              >
                Connect First Account
              </button>
          </div>
        ) : (
          accounts.map(account => (
            <div key={account.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-6 transition hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className="relative">
                  {account.avatarUrl ? (
                    <img src={account.avatarUrl} alt={account.name} className="w-12 h-12 rounded-full border border-slate-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                      {getPlatformIcon(account.provider)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                    {getPlatformIcon(account.provider)}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-800 text-lg">{account.name}</h3>
                    {account.status === 'Connected' ? (
                      <span className="bg-green-50 text-green-700 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide flex items-center gap-1 border border-green-100">
                        <CheckCircle2 size={10} /> Active
                      </span>
                    ) : (
                      <span className="bg-red-50 text-red-700 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide flex items-center gap-1 border border-red-100">
                        <AlertCircle size={10} /> {account.status}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 font-medium font-mono mt-0.5">{account.email}</p>
                  
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5" title={`Last synced: ${new Date(account.lastSyncedAt).toLocaleString()}`}>
                      <Clock size={12} /> Synced: {formatLastSynced(account.lastSyncedAt)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={12} /> Token Valid
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 sm:pt-2 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto">
                <button 
                  onClick={() => handleSync(account.id)}
                  disabled={syncingId === account.id || account.status !== 'Connected'}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    syncingId === account.id 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <RefreshCw size={14} className={syncingId === account.id ? 'animate-spin' : ''} />
                  {syncingId === account.id ? 'Syncing...' : 'Resync'}
                </button>
                
                <button 
                  onClick={() => onRemoveAccount(account.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition border border-transparent hover:border-red-100"
                  title="Disconnect Account"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-5 flex items-start gap-4">
        <div className="bg-white p-2 rounded-full text-indigo-600 shadow-sm shrink-0">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h4 className="font-bold text-indigo-900 mb-1">Privacy & Security</h4>
          <p className="text-sm text-indigo-800/80 leading-relaxed">
            JobHunt Tracker uses <strong>OAuth 2.0</strong> to securely access your accounts. We only request read-only permissions necessary to identify job-related emails and messages. 
            Access tokens are stored locally in your browser and are never shared with third parties.
          </p>
        </div>
      </div>

      <ConnectAccountModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onAddAccount}
      />
    </div>
  );
};

export default AccountsManager;
