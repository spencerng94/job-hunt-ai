import React, { useState, useEffect } from 'react';
import { JobApplication, ApplicationStatus } from '../types';
import { X, Briefcase, Building2, Link as LinkIcon, Calendar, Check, Loader2 } from 'lucide-react';

interface CreateApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (app: Partial<JobApplication>) => void;
  initialData: Partial<JobApplication> | null;
  isLoading: boolean;
}

const CreateApplicationModal: React.FC<CreateApplicationModalProps> = ({ 
  isOpen, onClose, onSubmit, initialData, isLoading 
}) => {
  const [formData, setFormData] = useState<Partial<JobApplication>>({
    companyName: '',
    roleTitle: '',
    jobLink: '',
    status: ApplicationStatus.RECRUITER_SCREEN,
    nextInterviewDate: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">Create New Application</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
             <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
             <p className="text-slate-600 font-medium">Analyzing email content...</p>
             <p className="text-xs text-slate-400 mt-1">Extracting company, role, and details.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Company Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. Google"
                  value={formData.companyName}
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Role Title</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={formData.roleTitle}
                  onChange={e => setFormData({...formData, roleTitle: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as ApplicationStatus})}
                  >
                    {Object.values(ApplicationStatus).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Next Interview</label>
                  <div className="relative">
                    <input 
                      type="datetime-local"
                      className="w-full px-2 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData.nextInterviewDate ? formData.nextInterviewDate.slice(0, 16) : ''}
                      onChange={e => setFormData({...formData, nextInterviewDate: e.target.value})}
                    />
                  </div>
                </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Job Link (Optional)</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://..."
                  value={formData.jobLink}
                  onChange={e => setFormData({...formData, jobLink: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm transition flex items-center justify-center gap-2"
              >
                <Check size={18} /> Create & Link
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateApplicationModal;