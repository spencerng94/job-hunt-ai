import React, { useState, useMemo } from 'react';
import { JobApplication, ApplicationStatus, Note } from '../types';
import { STATUS_COLORS } from '../constants';
import { Search, Filter, Briefcase, Plus, Calendar, User, ExternalLink, ChevronRight, CheckCircle, XCircle, Clock, FileText, Sparkles, Loader2, StickyNote, Send, Building2 } from 'lucide-react';
import { analyzeJobDescription } from '../services/geminiService';

interface ApplicationManagerProps {
  applications: JobApplication[];
  onUpdateApplication: (app: JobApplication) => void;
  onAddApplication: (app: JobApplication) => void;
}

const ApplicationManager: React.FC<ApplicationManagerProps> = ({ applications, onUpdateApplication, onAddApplication }) => {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Derived State
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const matchesStatus = filterStatus === 'All' || app.status === filterStatus;
      const matchesSearch = 
        app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        app.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.recruiter?.name && app.recruiter.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [applications, filterStatus, searchQuery]);

  const selectedApp = applications.find(a => a.id === selectedAppId);

  const handleStatusChange = (newStatus: ApplicationStatus) => {
    if (selectedApp) {
      onUpdateApplication({ ...selectedApp, status: newStatus });
    }
  };

  const handleAddNote = (text: string) => {
    if (selectedApp) {
      const newNote: Note = {
        id: Date.now().toString(),
        content: text,
        date: new Date().toISOString()
      };
      onUpdateApplication({ ...selectedApp, notes: [...selectedApp.notes, newNote] });
    }
  };

  const updateInterviewTime = (date: string, time: string) => {
    if (!selectedApp) return;
    if (!date) {
        onUpdateApplication({ ...selectedApp, nextInterviewDate: undefined });
        return;
    }
    const validTime = time || '10:00';
    onUpdateApplication({ ...selectedApp, nextInterviewDate: `${date}T${validTime}` });
  };

  const handleAnalyzeJD = async () => {
    if (!selectedApp || !selectedApp.jobDescription) return;
    setIsAnalyzing(true);
    try {
        const notesContext = selectedApp.notes.map(n => n.content).join('\n');
        const result = await analyzeJobDescription(selectedApp.jobDescription, notesContext);
        onUpdateApplication({
            ...selectedApp,
            aiSummary: result.summary,
            aiSkills: result.skills
        });
    } catch (e) {
        console.error(e);
        alert("Failed to analyze job description. Please check your API key.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleCreateNew = () => {
    const newApp: JobApplication = {
      id: `app_${Date.now()}`,
      dateApplied: new Date().toISOString(),
      companyName: 'New Company',
      roleTitle: 'New Role',
      jobLink: '',
      status: ApplicationStatus.SUBMITTED,
      notes: [],
    };
    onAddApplication(newApp);
    setSelectedAppId(newApp.id);
  };

  const guessCompanyLogo = (name: string, link: string) => {
    if (!selectedApp) return;
    
    let domain = '';
    // 1. Try to get domain from link
    if (link) {
        try {
            const url = new URL(link);
            domain = url.hostname;
        } catch(e) {}
    }
    // 2. Fallback to guessing from name
    if (!domain && name) {
        domain = name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
    }

    if (domain) {
        const logoUrl = `https://logo.clearbit.com/${domain}`;
        onUpdateApplication({ ...selectedApp, logoUrl, companyName: name, jobLink: link });
    } else {
        onUpdateApplication({ ...selectedApp, companyName: name, jobLink: link });
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6">
      {/* Left: List View */}
      <div className={`${selectedAppId ? 'hidden lg:flex lg:w-1/2' : 'w-full'} flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300`}>
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Applications</h2>
            <button 
              onClick={handleCreateNew}
              className="flex items-center gap-1 bg-slate-900 text-white px-3 py-1.5 rounded-md text-sm hover:bg-slate-800 transition"
            >
              <Plus size={16} /> New
            </button>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search company or role..." 
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative">
              <select 
                className="pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Statuses</option>
                {Object.values(ApplicationStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <Filter className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredApps.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No applications found matching your filters.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase sticky top-0">
                <tr>
                  <th className="p-3 font-semibold">Role & Company</th>
                  <th className="p-3 font-semibold hidden sm:table-cell">Status</th>
                  <th className="p-3 font-semibold hidden md:table-cell">Next Interview</th>
                  <th className="p-3 font-semibold hidden lg:table-cell">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map(app => (
                  <tr 
                    key={app.id} 
                    onClick={() => setSelectedAppId(app.id)}
                    className={`cursor-pointer transition hover:bg-slate-50 ${selectedAppId === app.id ? 'bg-indigo-50 hover:bg-indigo-50' : ''}`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                            {app.logoUrl ? (
                                <img 
                                    src={app.logoUrl} 
                                    alt={app.companyName} 
                                    className="w-full h-full object-contain" 
                                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('bg-slate-50'); }}
                                />
                            ) : <Building2 size={16} className="text-slate-300" />}
                         </div>
                         <div>
                            <div className="font-medium text-slate-900">{app.roleTitle}</div>
                            <div className="text-sm text-slate-500">{app.companyName}</div>
                            {app.needsReview && <span className="inline-block mt-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded border border-amber-200">Needs Review</span>}
                         </div>
                      </div>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[app.status]}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      {app.nextInterviewDate ? (
                         <div className="flex flex-col">
                             <span className="text-sm font-medium text-slate-700">
                                {new Date(app.nextInterviewDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                             </span>
                             <span className="text-xs text-slate-500">
                                {new Date(app.nextInterviewDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                         </div>
                      ) : (
                         <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3 hidden lg:table-cell text-sm text-slate-500">
                      {new Date(app.dateApplied).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right: Detail View */}
      {selectedApp ? (
        <div className={`w-full lg:w-1/2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full animate-fade-in`}>
          <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
            <div className="flex-1 min-w-0 mr-4">
              <div className="flex items-center gap-2 mb-2">
                 {/* Logo in Detail View */}
                 <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {selectedApp.logoUrl ? (
                        <img 
                            src={selectedApp.logoUrl} 
                            alt={selectedApp.companyName} 
                            className="w-full h-full object-contain" 
                            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('bg-slate-50'); }}
                        />
                    ) : <Building2 size={20} className="text-slate-300" />}
                 </div>
                 <div className="flex-1">
                    <input 
                        type="text"
                        className="text-2xl font-bold text-slate-900 bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded px-1 -ml-1 w-full transition-all placeholder:text-slate-300"
                        value={selectedApp.roleTitle}
                        onChange={(e) => onUpdateApplication({...selectedApp, roleTitle: e.target.value})}
                        placeholder="Role Title"
                    />
                 </div>
              </div>

              <div className="flex items-center gap-2">
                <input 
                    type="text"
                    className="text-lg text-slate-600 font-medium bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded px-1 -ml-1 w-full transition-all placeholder:text-slate-300"
                    value={selectedApp.companyName}
                    onChange={(e) => onUpdateApplication({...selectedApp, companyName: e.target.value})}
                    onBlur={(e) => guessCompanyLogo(e.target.value, selectedApp.jobLink || '')}
                    placeholder="Company Name"
                />
                {selectedApp.jobLink && (
                  <a href={selectedApp.jobLink} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600 shrink-0 p-1">
                    <ExternalLink size={18} />
                  </a>
                )}
              </div>
            </div>
            <button onClick={() => setSelectedAppId(null)} className="lg:hidden text-slate-400 hover:text-slate-600">
              <XCircle size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Status Flow */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Status</label>
              <select 
                value={selectedApp.status}
                onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                {Object.values(ApplicationStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Recruiter Details */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-3 text-slate-800 font-semibold">
                <User size={18} /> Recruiter Info
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  className="bg-white border border-slate-300 text-sm rounded p-2 w-full text-slate-900 placeholder:text-slate-400" 
                  placeholder="Name" 
                  value={selectedApp.recruiter?.name || ''} 
                  onChange={(e) => onUpdateApplication({...selectedApp, recruiter: {...selectedApp.recruiter, name: e.target.value}})}
                />
                 <input 
                  className="bg-white border border-slate-300 text-sm rounded p-2 w-full text-slate-900 placeholder:text-slate-400" 
                  placeholder="Email" 
                  value={selectedApp.recruiter?.email || ''} 
                  onChange={(e) => onUpdateApplication({...selectedApp, recruiter: {...selectedApp.recruiter, email: e.target.value}})}
                />
              </div>
            </div>

            {/* Next Interview */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
               <div className="flex items-center gap-2 mb-3 text-slate-800 font-semibold">
                <Calendar size={18} /> Next Interview
              </div>
              
              <div className="flex gap-2">
                 <div className="relative flex-1">
                   <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                   <input 
                      type="date"
                      className="w-full pl-9 pr-2 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900"
                      value={selectedApp.nextInterviewDate ? selectedApp.nextInterviewDate.split('T')[0] : ''}
                      onChange={(e) => updateInterviewTime(e.target.value, selectedApp.nextInterviewDate ? selectedApp.nextInterviewDate.split('T')[1] : '')}
                   />
                 </div>
                 <div className="relative w-1/3">
                   <Clock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                   <input 
                      type="time"
                      className="w-full pl-9 pr-2 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900"
                      value={selectedApp.nextInterviewDate ? selectedApp.nextInterviewDate.split('T')[1] : ''}
                      onChange={(e) => updateInterviewTime(selectedApp.nextInterviewDate ? selectedApp.nextInterviewDate.split('T')[0] : new Date().toISOString().split('T')[0], e.target.value)}
                   />
                 </div>
              </div>
            </div>

            {/* Job Description & AI Analysis */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold">
                        <FileText size={18} /> Job Description & Insights
                    </div>
                </div>
                
                <div className="p-4 space-y-4">
                    {/* Link Input */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Job Description URL</label>
                        <div className="relative">
                            <ExternalLink className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input 
                                type="text"
                                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                                placeholder="Paste link (e.g. https://linkedin.com/jobs/...)"
                                value={selectedApp.jobLink || ''}
                                onChange={(e) => onUpdateApplication({...selectedApp, jobLink: e.target.value})}
                                onBlur={(e) => guessCompanyLogo(selectedApp.companyName, e.target.value)}
                            />
                        </div>
                    </div>
                    
                    {/* JD Textarea */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Job Description</label>
                        <textarea 
                            className="w-full h-40 p-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm resize-y leading-relaxed"
                            placeholder="Paste the full Job Description text here..."
                            value={selectedApp.jobDescription || ''}
                            onChange={(e) => onUpdateApplication({...selectedApp, jobDescription: e.target.value})}
                        />
                    </div>

                    {/* AI Button */}
                    <button 
                        onClick={handleAnalyzeJD}
                        disabled={isAnalyzing || !selectedApp.jobDescription}
                        className={`w-full py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition ${
                            !selectedApp.jobDescription 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                        }`}
                    >
                        {isAnalyzing ? (
                            <><Loader2 className="animate-spin" size={16} /> Analyzing...</>
                        ) : (
                            <><Sparkles size={16} /> Analyze with AI</>
                        )}
                    </button>
                    
                    {/* Results */}
                    {(selectedApp.aiSummary || (selectedApp.aiSkills && selectedApp.aiSkills.length > 0)) && (
                        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 animate-fade-in">
                            {selectedApp.aiSummary && (
                                <div className="mb-4">
                                    <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">Summary</h4>
                                    <p className="text-sm text-slate-700 leading-relaxed">{selectedApp.aiSummary}</p>
                                </div>
                            )}
                            {selectedApp.aiSkills && selectedApp.aiSkills.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">Key Skills</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedApp.aiSkills.map((skill, i) => (
                                            <span key={i} className="bg-white text-indigo-700 px-2 py-1 rounded text-xs font-medium border border-indigo-100 shadow-sm">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Notes Section */}
            <div>
              <div className="flex items-center gap-2 text-slate-800 font-semibold mb-3">
                 <StickyNote size={18} /> Notes
              </div>
              
              <div className="space-y-3 mb-4">
                {selectedApp.notes.length === 0 ? (
                    <div className="p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        <p className="text-sm text-slate-400 italic">No notes added yet.</p>
                    </div>
                ) : (
                    selectedApp.notes.map(note => (
                    <div key={note.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-sm text-slate-800 transition hover:border-slate-300">
                        <p className="leading-relaxed whitespace-pre-wrap">{note.content}</p>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50">
                             <p className="text-xs text-slate-400">{new Date(note.date).toLocaleString()}</p>
                        </div>
                    </div>
                    ))
                )}
              </div>
              
              <div className="flex gap-2 items-start">
                <div className="relative flex-1">
                    <input 
                    id="new-note-input"
                    type="text" 
                    placeholder="Type a note and press Enter..." 
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                        handleAddNote(e.currentTarget.value);
                        e.currentTarget.value = '';
                        }
                    }}
                    />
                </div>
                <button 
                  onClick={() => {
                    const input = document.getElementById('new-note-input') as HTMLInputElement;
                    if (input.value) {
                      handleAddNote(input.value);
                      input.value = '';
                    }
                  }}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-2"
                >
                  <Send size={16} /> Add
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex w-1/2 items-center justify-center bg-slate-50 rounded-xl border border-slate-200 border-dashed text-slate-400">
          <div className="text-center">
            <Briefcase size={48} className="mx-auto mb-2 opacity-20" />
            <p>Select an application to view details</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationManager;