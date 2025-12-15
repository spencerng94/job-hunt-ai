import React, { useState, useEffect } from 'react';
import { JobApplication, ApplicationStatus } from '../types';
import { X, Briefcase, Building2, Link as LinkIcon, Calendar, Check, Loader2, Clock } from 'lucide-react';

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
    logoUrl: '',
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
    // Guess logo if not present
    if (!formData.logoUrl) {
       let logoUrl = undefined;
       if (formData.jobLink) {
          try {
             const url = new URL(formData.jobLink);
             logoUrl = `https://logo.clearbit.com/${url.hostname}`;
          } catch(e) {}
       }
       if (!logoUrl && formData.companyName) {
           const clean = formData.companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
           logoUrl = `https://logo.clearbit.com/${clean}.com`;
       }
       onSubmit({ ...formData, logoUrl });
    } else {
       onSubmit(formData);
    }
  };

  // Helper to manage split date/time inputs
  const currentDateTime = formData.nextInterviewDate || '';
  const [datePart, timePart] = currentDateTime.split('T');

  const handleDateChange = (date: string) => {
    if (!date) {
      setFormData({ ...formData, nextInterviewDate: '' });
      return;
    }
    // Default to 10:00 AM if setting date for the first time
    const time = timePart || '10:00';
    setFormData({ ...formData, nextInterviewDate: `${date}T${time}` });
  };

  const handleTimeChange = (time: string) => {
    // Default to today if setting time without date
    const date = datePart || new Date().toISOString().split('T')[0];
    setFormData({ ...formData, nextInterviewDate: `${date}T${time}` });
  };

  const handleCompanyBlur = () => {
     if (formData.companyName && !formData.logoUrl) {
        const clean = formData.companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
        setFormData(prev => ({ ...prev, logoUrl: `https://logo.clearbit.com/${clean}.com` }));
     }
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
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 mt-6">
                  {formData.logoUrl ? (
                      <img 
                        src={formData.logoUrl} 
                        alt="Logo" 
                        className="w-full h-full object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('bg-slate-100'); }}
                      />
                  ) : <Building2 size={24} className="text-slate-300" />}
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Company Name</label>
                <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                    required
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g. Google"
                    value={formData.companyName}
                    onChange={e => setFormData({...formData, companyName: e.target.value})}
                    onBlur={handleCompanyBlur}
                    />
                </div>
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

            <div className="space-y-3">
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
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Next Interview Schedule</label>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="col-span-3 relative">
                      <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input 
                        type="date"
                        className="w-full pl-9 pr-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={datePart || ''}
                        onChange={e => handleDateChange(e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 relative">
                      <Clock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input 
                        type="time"
                        className="w-full pl-9 pr-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={timePart || ''}
                        onChange={e => handleTimeChange(e.target.value)}
                      />
                    </div>
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