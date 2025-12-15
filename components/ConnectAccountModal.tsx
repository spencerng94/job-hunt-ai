import React, { useState, useEffect } from 'react';
import { Mail, Linkedin, X, Shield, CheckCircle, ArrowRight, Settings, AlertTriangle } from 'lucide-react';
import { AccountProvider, ConnectedAccount } from '../types';
import { connectAccount, getGoogleClientId } from '../services/authService';

interface ConnectAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account: ConnectedAccount) => void;
}

const ConnectAccountModal: React.FC<ConnectAccountModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<AccountProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Manual override state
  const [manualClientId, setManualClientId] = useState('');
  const [hasClientId, setHasClientId] = useState(!!getGoogleClientId());

  useEffect(() => {
    if (isOpen) {
      setHasClientId(!!getGoogleClientId());
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveClientId = () => {
    if (manualClientId.trim()) {
      localStorage.setItem('jh_google_client_id', manualClientId.trim());
      setHasClientId(true);
      setError(null);
      // Small delay to ensure authService picks up the change if needed
      setTimeout(() => {
        alert("Client ID Saved! You can now try connecting Gmail.");
      }, 100);
    }
  };

  const handleConnect = async (provider: AccountProvider) => {
    if (provider === 'Gmail' && !hasClientId) {
      setError("Please enter a Google Client ID to connect Gmail in Real Mode.");
      return;
    }

    setIsConnecting(true);
    setConnectingProvider(provider);
    setError(null);
    
    try {
      const newAccount = await connectAccount(provider);
      onSuccess(newAccount);
      onClose();
    } catch (err: any) {
      console.error("Failed to connect account", err);
      if (err.type === 'token_failed') {
          setError("Google Authentication failed. Please check your popup blocker or try again.");
      } else {
          setError(err.message || "Failed to connect. Please check console for details.");
      }
    } finally {
      setIsConnecting(false);
      setConnectingProvider(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">Connect Account</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex gap-2 items-start">
               <AlertTriangle size={16} className="shrink-0 mt-0.5" />
               <p>{error}</p>
            </div>
          )}

          {isConnecting ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
               <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center relative">
                 <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                 {connectingProvider === 'Gmail' ? <Mail className="text-indigo-600" /> : <Linkedin className="text-indigo-600" />}
               </div>
               <div className="text-center">
                 <h4 className="font-bold text-slate-800 text-lg">Connecting to {connectingProvider}...</h4>
                 <p className="text-sm text-slate-500">Please complete the login in the popup window.</p>
               </div>
            </div>
          ) : (
            <>
              {!hasClientId && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-2">
                  <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold text-sm">
                    <Settings size={16} /> Configure Client ID
                  </div>
                  <p className="text-xs text-amber-700 mb-3">
                    Your environment variables weren't detected. Enter your Google Client ID manually to enable Real Mode.
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter Google Client ID" 
                      className="flex-1 text-xs p-2 border border-amber-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                      value={manualClientId}
                      onChange={(e) => setManualClientId(e.target.value)}
                    />
                    <button 
                      onClick={handleSaveClientId}
                      className="bg-amber-600 text-white text-xs px-3 py-2 rounded font-medium hover:bg-amber-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              <p className="text-sm text-slate-500 mb-2">Select a provider to scan for job applications and recruiter messages.</p>
              
              {/* Gmail Button */}
              <button 
                onClick={() => handleConnect('Gmail')}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-red-200 hover:bg-red-50/30 transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <Mail size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-800 group-hover:text-red-700">Gmail</div>
                    <div className="text-xs text-slate-500">Scan emails for applications</div>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-red-400" />
              </button>

              {/* LinkedIn Button */}
              <button 
                onClick={() => handleConnect('LinkedIn')}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Linkedin size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-800 group-hover:text-blue-700">LinkedIn</div>
                    <div className="text-xs text-slate-500">Sync messages & InMail</div>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-400" />
              </button>

              <div className="mt-4 bg-slate-50 p-3 rounded-lg flex items-start gap-3 border border-slate-100">
                <Shield size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  We only request <strong>read-only</strong> access. Your tokens are encrypted and stored locally. We never post on your behalf.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectAccountModal;