import React, { useState, useMemo } from 'react';
import { JobApplication, ApplicationStatus, Note } from '../types';
import { STATUS_COLORS } from '../constants';
import { Search, Filter, Briefcase, Plus, Calendar, User, ExternalLink, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react';

interface ApplicationManagerProps {
  applications: JobApplication[];
  onUpdateApplication: (app: JobApplication) => void;
  onAddApplication: (app: JobApplication) => void;
}

const ApplicationManager: React.FC<ApplicationManagerProps> = ({ applications, onUpdateApplication, onAddApplication }) => {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);

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

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6">
      {/* Left: List View */}
      <div className={`${selectedAppId ? 'hidden lg:flex lg:w-1/2' : 'w-full'} flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300`}>
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Applications</h2>
            <button className="flex items-center gap-1 bg-slate-900 text-white px-3 py-1.5 rounded-md text-sm hover:bg-slate-800 transition">
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
                  <th className="p-3 font-semibold hidden md:table-cell">Applied</th>
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
                      <div className="font-medium text-slate-900">{app.roleTitle}</div>
                      <div className="text-sm text-slate-500">{app.companyName}</div>
                      {app.needsReview && <span className="inline-block mt-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded border border-amber-200">Needs Review</span>}
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[app.status]}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-3 hidden md:table-cell text-sm text-slate-500">
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
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-900">{selectedApp.roleTitle}</h2>
                <a href={selectedApp.jobLink} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600">
                  <ExternalLink size={18} />
                </a>
              </div>
              <div className="text-lg text-slate-600 font-medium">{selectedApp.companyName}</div>
            </div>
            <button onClick={() => setSelectedAppId(null)} className="lg:hidden text-slate-400">
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
                  className="bg-white border border-slate-300 text-sm rounded p-2 w-full" 
                  placeholder="Name" 
                  value={selectedApp.recruiter?.name || ''} 
                  onChange={(e) => onUpdateApplication({...selectedApp, recruiter: {...selectedApp.recruiter, name: e.target.value}})}
                />
                 <input 
                  className="bg-white border border-slate-300 text-sm rounded p-2 w-full" 
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
                      className="w-full pl-9 pr-2 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                      value={selectedApp.nextInterviewDate ? selectedApp.nextInterviewDate.split('T')[0] : ''}
                      onChange={(e) => updateInterviewTime(e.target.value, selectedApp.nextInterviewDate ? selectedApp.nextInterviewDate.split('T')[1] : '')}
                   />
                 </div>
                 <div className="relative w-1/3">
                   <Clock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                   <input 
                      type="time"
                      className="w-full pl-9 pr-2 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                      value={selectedApp.nextInterviewDate ? selectedApp.nextInterviewDate.split('T')[1] : ''}
                      onChange={(e) => updateInterviewTime(selectedApp.nextInterviewDate ? selectedApp.nextInterviewDate.split('T')[0] : new Date().toISOString().split('T')[0], e.target.value)}
                   />
                 </div>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Notes</h3>
              <div className="space-y-3 mb-3">
                {selectedApp.notes.map(note => (
                  <div key={note.id} className="bg-amber-50 p-3 rounded border border-amber-100 text-sm text-slate-800">
                    <p>{note.content}</p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(note.date).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  id="new-note-input"
                  type="text" 
                  placeholder="Add a note..." 
                  className="flex-1 border border-slate-300 rounded p-2 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddNote(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    const input = document.getElementById('new-note-input') as HTMLInputElement;
                    if (input.value) {
                      handleAddNote(input.value);
                      input.value = '';
                    }
                  }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded text-sm font-medium"
                >
                  Add
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