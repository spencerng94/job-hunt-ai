import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ApplicationManager from './components/ApplicationManager';
import InboundEmails from './components/InboundEmails';
import AccountsManager from './components/AccountsManager';
import CalendarView from './components/CalendarView';
import UpcomingInterviews from './components/UpcomingInterviews';
import AboutPage from './components/AboutPage';
import { JobApplication, ApplicationStatus, InboundMessage, ConnectedAccount } from './types';
import { INITIAL_APPLICATIONS, MOCK_MESSAGES, MOCK_ACCOUNTS, NEW_INBOUND_MESSAGE } from './constants';
import { Menu, RefreshCw, Database } from 'lucide-react';
import { syncAccountData } from './services/authService';
import { fetchGmailMessages, trashGmailMessage, sendGmailReply } from './services/gmailService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Data Mode State
  const [isMockMode, setIsMockMode] = useState<boolean>(true);

  // Application Data
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [messages, setMessages] = useState<InboundMessage[]>([]);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);

  // Scanning State
  const [isEmailScanned, setIsEmailScanned] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Initialize Data based on Mode
  useEffect(() => {
    if (isMockMode) {
      // Load Mock Constants
      setApplications(INITIAL_APPLICATIONS);
      setMessages(MOCK_MESSAGES);
      setAccounts(MOCK_ACCOUNTS);
      setIsEmailScanned(true); // Mock mode pretends we've already scanned
    } else {
      // Load Real Data from LocalStorage (if exists)
      const storedApps = localStorage.getItem('jh_real_applications');
      const storedMsgs = localStorage.getItem('jh_real_messages');
      const storedAccs = localStorage.getItem('jh_real_accounts');

      setApplications(storedApps ? JSON.parse(storedApps) : []);
      setMessages(storedMsgs ? JSON.parse(storedMsgs) : []);
      setAccounts(storedAccs ? JSON.parse(storedAccs) : []);
      setIsEmailScanned(false); // Reset scan status for real mode
    }
  }, [isMockMode]);

  // Persist Real Data when it changes (and not in mock mode)
  useEffect(() => {
    if (!isMockMode) {
      localStorage.setItem('jh_real_applications', JSON.stringify(applications));
      localStorage.setItem('jh_real_messages', JSON.stringify(messages));
      localStorage.setItem('jh_real_accounts', JSON.stringify(accounts));
    }
  }, [applications, messages, accounts, isMockMode]);

  const handleUpdateApplication = (updatedApp: JobApplication) => {
    setApplications(prev => prev.map(app => app.id === updatedApp.id ? updatedApp : app));
  };

  const handleAddApplication = (newApp: JobApplication) => {
    setApplications(prev => [newApp, ...prev]);
  };

  const handleLinkMessage = (message: InboundMessage, appId: string) => {
    setMessages(prev => prev.map(m => m.id === message.id ? { ...m, linkedApplicationId: appId } : m));
  };
  
  const handleAddAccount = (account: ConnectedAccount) => {
    setAccounts(prev => [...prev, account]);
  };

  const handleRemoveAccount = (id: string) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
    setMessages(prev => prev.filter(msg => msg.accountId !== id));
  };

  const handleDeleteMessage = async (id: string) => {
    // Check if this is a real message that needs to be deleted from Gmail
    const messageToDelete = messages.find(m => m.id === id);
    if (messageToDelete) {
       const account = accounts.find(a => a.id === messageToDelete.accountId);
       
       // Perform API deletion if it's a real Gmail account and we are not in mock mode
       if (account && account.provider === 'Gmail' && !isMockMode && !account.accessToken.startsWith('mock_')) {
          try {
             const success = await trashGmailMessage(account.accessToken, id);
             if (!success) {
                console.warn("Failed to move to trash in Gmail API, removing locally only.");
             }
          } catch(e) {
             console.error("Error deleting from Gmail:", e);
          }
       }
    }

    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const handleReplyMessage = async (message: InboundMessage, body: string): Promise<boolean> => {
     const account = accounts.find(a => a.id === message.accountId);
     if (!account) {
         alert("Could not find the account associated with this message.");
         return false;
     }

     try {
         await sendGmailReply(account.accessToken, body, message);
         return true;
     } catch (e: any) {
         console.error("Failed to send reply:", e);
         alert(`Failed to send email: ${e.message}`);
         return false;
     }
  };

  const handleSyncAccount = async (id: string) => {
    const account = accounts.find(a => a.id === id);
    if (!account) return;

    try {
      const updatedAccount = await syncAccountData(account);
      setAccounts(prev => prev.map(a => a.id === id ? updatedAccount : a));
    } catch (e) {
      console.error("Sync failed", e);
    }
  };

  const handleScanMessages = async (timeWindow: string = '30d') => {
    setIsScanning(true);
    
    // 1. Sync account tokens/status
    const syncPromises = accounts.map(acc => syncAccountData(acc));
    
    try {
      const updatedAccounts = await Promise.all(syncPromises);
      setAccounts(updatedAccounts); 

      // 2. Fetch Real Messages from Gmail Accounts
      let newRealMessages: InboundMessage[] = [];
      for (const acc of updatedAccounts) {
        if (acc.provider === 'Gmail' && acc.accessToken && !acc.accessToken.startsWith('mock_')) {
          // Pass the selected time window to the service
          const gmailMsgs = await fetchGmailMessages(acc.accessToken, acc.id, 20, timeWindow);
          newRealMessages = [...newRealMessages, ...gmailMsgs];
        }
      }
      
      setTimeout(() => {
        setIsScanning(false);
        setIsEmailScanned(true);
        
        // 3. Merge Real Messages with Existing (deduplicating by ID)
        setMessages(prev => {
           // Start with previous messages
           const existingIds = new Set(prev.map(m => m.id));
           const uniqueNewReal = newRealMessages.filter(m => !existingIds.has(m.id));
           
           let final = [...uniqueNewReal, ...prev];

           return final.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
        });
        
      }, 1500); 
    } catch (error: any) {
      console.error("Global scan failed", error);
      setIsScanning(false);
      
      // Show alerts for specific user-facing errors
      if (error.message) {
          if (error.message.includes("Gmail permission") || error.message.includes("Gmail API")) {
              alert(error.message);
          } else if (error.message.includes("Access token expired")) {
              alert("Your Google session has expired. Please reconnect your account.");
          }
      }
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard applications={applications} />;
      case 'applications':
        return (
          <ApplicationManager 
            applications={applications} 
            onUpdateApplication={handleUpdateApplication}
            onAddApplication={handleAddApplication}
          />
        );
      case 'calendar':
        return <CalendarView applications={applications} />;
      case 'interviews':
        return <UpcomingInterviews applications={applications} />;
      case 'emails':
        return (
          <InboundEmails 
            emails={messages} 
            applications={applications}
            onLinkEmail={handleLinkMessage}
            onUpdateAppStatus={(appId, status) => {
              const app = applications.find(a => a.id === appId);
              if (app) handleUpdateApplication({ ...app, status });
            }}
            onAddApplication={handleAddApplication}
            onDeleteMessage={handleDeleteMessage}
            onReply={handleReplyMessage}
            isScanned={isEmailScanned}
            isScanning={isScanning}
            onScan={handleScanMessages}
          />
        );
      case 'accounts':
        return (
          <AccountsManager 
            accounts={accounts}
            onAddAccount={handleAddAccount}
            onRemoveAccount={handleRemoveAccount}
            onSyncAccount={handleSyncAccount}
          />
        );
      case 'contacts':
        return (
          <div className="bg-white p-10 rounded-xl shadow-sm border border-slate-200 text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Recruiter Contacts</h2>
            <p className="text-slate-500">A database of all recruiters contacted (Feature Coming Soon)</p>
          </div>
        );
      case 'about':
        return <AboutPage />;
      default:
        return <Dashboard applications={applications} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMockMode={isMockMode}
        onToggleMockMode={() => setIsMockMode(!isMockMode)}
      />
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="bg-slate-900 w-64 h-full p-4" onClick={e => e.stopPropagation()}>
             <div className="space-y-4 mt-8">
               <button onClick={() => {setActiveTab('dashboard'); setIsMobileMenuOpen(false)}} className="block text-white">Dashboard</button>
               <button onClick={() => {setActiveTab('applications'); setIsMobileMenuOpen(false)}} className="block text-white">Applications</button>
               {/* ... other mobile links ... */}
               <div className="pt-4 border-t border-slate-700">
                  <button onClick={() => setIsMockMode(!isMockMode)} className="flex items-center gap-2 text-white w-full">
                     <Database size={16} className={isMockMode ? "text-amber-400" : "text-green-400"} />
                     {isMockMode ? 'Switch to Real Data' : 'Switch to Mock Data'}
                  </button>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 transition-all duration-300">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-600" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-slate-800 capitalize flex items-center gap-3">
              {activeTab === 'emails' ? 'Messages' : activeTab.replace('-', ' ')}
              {!isMockMode && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200 font-medium hidden sm:inline-block">
                  Real Data Mode
                </span>
              )}
            </h2>
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={() => handleScanMessages('30d')}
               disabled={isScanning || accounts.length === 0}
               title={accounts.length === 0 ? "Connect an account to scan" : "Scan recent emails"}
               className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md transition ${
                 accounts.length === 0 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100'
               }`}
             >
               <RefreshCw size={16} className={isScanning ? "animate-spin" : ""} />
               <span className="hidden sm:inline">Rescan</span>
             </button>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;