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
import { Menu, RefreshCw } from 'lucide-react';
import { syncAccountData } from './services/authService';
import { fetchGmailMessages } from './services/gmailService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [applications, setApplications] = useState<JobApplication[]>(INITIAL_APPLICATIONS);
  const [messages, setMessages] = useState<InboundMessage[]>(MOCK_MESSAGES);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>(MOCK_ACCOUNTS);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Email Scanning State
  const [isEmailScanned, setIsEmailScanned] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Load from local storage on mount (Simulation)
  useEffect(() => {
    // In a real app, we'd fetch here
  }, []);

  const handleUpdateApplication = (updatedApp: JobApplication) => {
    setApplications(prev => prev.map(app => app.id === updatedApp.id ? updatedApp : app));
  };

  const handleAddApplication = (newApp: JobApplication) => {
    setApplications(prev => [newApp, ...prev]);
  };

  const handleLinkMessage = (message: InboundMessage, appId: string) => {
    console.log(`Linking message ${message.id} to app ${appId}`);
    setMessages(prev => prev.map(m => m.id === message.id ? { ...m, linkedApplicationId: appId } : m));
  };
  
  const handleAddAccount = (account: ConnectedAccount) => {
    setAccounts(prev => [...prev, account]);
  };

  const handleRemoveAccount = (id: string) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
    // Also optional: remove messages associated with this account
    setMessages(prev => prev.filter(msg => msg.accountId !== id));
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

  const handleScanMessages = async () => {
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
          const gmailMsgs = await fetchGmailMessages(acc.accessToken, acc.id);
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
           
           // Also add the demo mock message if strictly using mocks
           const messageExists = prev.some(m => m.id === NEW_INBOUND_MESSAGE.id);
           const shouldAddMock = accounts.some(a => a.accessToken.startsWith('mock_')) && !messageExists;
           
           let final = [...uniqueNewReal, ...prev];
           
           if (shouldAddMock) {
              const newMessageWithAccount = { ...NEW_INBOUND_MESSAGE, accountId: accounts[0].id };
              final = [newMessageWithAccount, ...final];
           }
           
           return final.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
        });
        
      }, 1500); // Artificial delay for UX
    } catch (error) {
      console.error("Global scan failed", error);
      setIsScanning(false);
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
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="bg-slate-900 w-64 h-full p-4" onClick={e => e.stopPropagation()}>
             <div className="space-y-4 mt-8">
               <button onClick={() => {setActiveTab('dashboard'); setIsMobileMenuOpen(false)}} className="block text-white">Dashboard</button>
               <button onClick={() => {setActiveTab('applications'); setIsMobileMenuOpen(false)}} className="block text-white">Applications</button>
               <button onClick={() => {setActiveTab('calendar'); setIsMobileMenuOpen(false)}} className="block text-white">Calendar</button>
               <button onClick={() => {setActiveTab('interviews'); setIsMobileMenuOpen(false)}} className="block text-white">Interviews</button>
               <button onClick={() => {setActiveTab('emails'); setIsMobileMenuOpen(false)}} className="block text-white">Messages</button>
               <button onClick={() => {setActiveTab('accounts'); setIsMobileMenuOpen(false)}} className="block text-white">Accounts</button>
               <button onClick={() => {setActiveTab('about'); setIsMobileMenuOpen(false)}} className="block text-white">About</button>
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
            <h2 className="text-xl font-bold text-slate-800 capitalize">{activeTab === 'emails' ? 'Messages' : activeTab.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={handleScanMessages}
               disabled={isScanning || accounts.length === 0}
               title={accounts.length === 0 ? "Connect an account to scan" : "Scan recent emails"}
               className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md transition ${
                 accounts.length === 0 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100'
               }`}
             >
               <RefreshCw size={16} className={isScanning ? "animate-spin" : ""} />
               <span className="hidden sm:inline">Rescan (30d)</span>
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