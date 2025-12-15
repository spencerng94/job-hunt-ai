import React from 'react';
import { JobApplication, ApplicationStatus } from '../types';
import { Calendar, Clock, MapPin, Video, ExternalLink, Briefcase, CalendarClock, AlertCircle } from 'lucide-react';
import { STATUS_COLORS } from '../constants';

interface UpcomingInterviewsProps {
  applications: JobApplication[];
}

const UpcomingInterviews: React.FC<UpcomingInterviewsProps> = ({ applications }) => {
  // 1. Scheduled Interviews
  const scheduledInterviews = applications
    .filter(app => app.nextInterviewDate)
    .sort((a, b) => new Date(a.nextInterviewDate!).getTime() - new Date(b.nextInterviewDate!).getTime());

  // 2. Pending Interviews (Active status but no date set)
  const pendingInterviews = applications.filter(app => 
    !app.nextInterviewDate && 
    (
        app.status === ApplicationStatus.RECRUITER_SCREEN ||
        app.status === ApplicationStatus.TECH_SCREEN ||
        app.status === ApplicationStatus.HIRING_MANAGER ||
        app.status === ApplicationStatus.ONSITE
    )
  );

  // Group Scheduled Interviews
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const grouped = scheduledInterviews.reduce((acc, app) => {
    const date = new Date(app.nextInterviewDate!);
    date.setHours(0, 0, 0, 0);
    
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    let group = 'Upcoming';
    if (diffDays < 0) group = 'Past';
    else if (diffDays === 0) group = 'Today';
    else if (diffDays === 1) group = 'Tomorrow';
    else if (diffDays <= 7) group = 'This Week';
    else if (diffDays <= 14) group = 'Next Week';
    else group = 'Later';

    if (!acc[group]) acc[group] = [];
    acc[group].push(app);
    return acc;
  }, {} as Record<string, JobApplication[]>);

  const groupOrder = ['Today', 'Tomorrow', 'This Week', 'Next Week', 'Later', 'Past'];

  return (
    <div className="max-w-4xl mx-auto pb-10 animate-fade-in">
       <div className="mb-8">
         <h2 className="text-2xl font-bold text-slate-800 mb-2">Interviews</h2>
         <p className="text-slate-500">Track your scheduled calls and applications pending scheduling.</p>
       </div>

       {scheduledInterviews.length === 0 && pendingInterviews.length === 0 ? (
         <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
               <Calendar size={32} />
            </div>
            <h3 className="font-bold text-slate-800 mb-2">No Interviews Scheduled</h3>
            <p className="text-slate-500">When you move an application to an interview stage, it will appear here.</p>
         </div>
       ) : (
         <div className="space-y-10">
           
           {/* Scheduled Section */}
           {scheduledInterviews.length > 0 && (
             <div className="space-y-8">
                {groupOrder.map(group => {
                    const apps = grouped[group];
                    if (!apps || apps.length === 0) return null;

                    return (
                    <div key={group}>
                        <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 px-1 ${
                        group === 'Today' ? 'text-indigo-600' : 
                        group === 'Past' ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                        {group}
                        </h3>
                        <div className="grid gap-4">
                        {apps.map(app => (
                            <div 
                                key={app.id} 
                                className={`bg-white p-5 rounded-xl shadow-sm border transition hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                                group === 'Past' ? 'opacity-60 grayscale border-slate-200' : 'border-slate-200 hover:border-indigo-200'
                                }`}
                            >
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                                    group === 'Today' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
                                }`}>
                                <Briefcase size={24} />
                                </div>
                                <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h4 className="font-bold text-slate-900 text-lg">{app.companyName}</h4>
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide ${STATUS_COLORS[app.status]}`}>
                                    {app.status}
                                    </span>
                                </div>
                                <p className="text-slate-600 font-medium mb-2">{app.roleTitle}</p>
                                
                                {app.recruiter?.name && (
                                    <p className="text-xs text-slate-400">
                                    With: <span className="text-slate-600">{app.recruiter.name}</span>
                                    </p>
                                )}
                                </div>
                            </div>

                            <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1 text-right border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                                    <Calendar size={16} className="text-indigo-500" />
                                    {new Date(app.nextInterviewDate!).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <Clock size={16} />
                                    {new Date(app.nextInterviewDate!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                {app.status === ApplicationStatus.ONSITE ? (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                                    <MapPin size={12} /> In-person
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                                    <Video size={12} /> Video Call
                                    </div>
                                )}
                            </div>
                            </div>
                        ))}
                        </div>
                    </div>
                    );
                })}
             </div>
           )}

           {/* Pending Interviews Section */}
           {pendingInterviews.length > 0 && (
             <div>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4 px-1 text-amber-600 flex items-center gap-2">
                    <CalendarClock size={16} /> Pending Interviews
                </h3>
                <div className="grid gap-4">
                    {pendingInterviews.map(app => (
                         <div 
                            key={app.id} 
                            className="bg-white p-5 rounded-xl shadow-sm border border-amber-200/60 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-amber-300 transition"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="font-bold text-slate-900 text-lg">{app.companyName}</h4>
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide ${STATUS_COLORS[app.status]}`}>
                                        {app.status}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 font-medium mb-1">{app.roleTitle}</p>
                                    <p className="text-xs text-slate-400 italic">Waiting to schedule date...</p>
                                </div>
                            </div>

                             <div className="flex flex-row md:flex-col items-center md:items-end gap-2 text-right border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                                <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full">
                                    To Be Determined
                                </span>
                             </div>
                        </div>
                    ))}
                </div>
             </div>
           )}

         </div>
       )}
    </div>
  );
};

export default UpcomingInterviews;