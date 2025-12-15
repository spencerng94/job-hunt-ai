import React, { useState } from 'react';
import { JobApplication, ApplicationStatus } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Info } from 'lucide-react';
import { STATUS_COLORS } from '../constants';

interface CalendarViewProps {
  applications: JobApplication[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ applications }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filter for applications with scheduled interviews
  const interviews = applications.filter(app => app.nextInterviewDate);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  
  // Generate calendar grid
  const days = [];
  // Empty slots for previous month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getInterviewsForDay = (day: number) => {
    return interviews.filter(app => {
      const interviewDate = new Date(app.nextInterviewDate!);
      return (
        interviewDate.getDate() === day &&
        interviewDate.getMonth() === currentDate.getMonth() &&
        interviewDate.getFullYear() === currentDate.getFullYear()
      );
    }).sort((a, b) => new Date(a.nextInterviewDate!).getTime() - new Date(b.nextInterviewDate!).getTime());
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Get unique statuses present in interviews for the legend, or show key statuses
  const legendStatuses = [
    ApplicationStatus.RECRUITER_SCREEN,
    ApplicationStatus.TECH_SCREEN,
    ApplicationStatus.HIRING_MANAGER,
    ApplicationStatus.ONSITE
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <CalendarIcon className="text-indigo-600" />
          Interview Calendar
        </h2>
        <div className="flex items-center gap-4 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold text-slate-700 w-32 text-center select-none">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 grid-rows-5 flex-1 overflow-y-auto">
        {days.map((day, index) => {
          const dayInterviews = day ? getInterviewsForDay(day) : [];
          const isToday = day === new Date().getDate() && 
                         currentDate.getMonth() === new Date().getMonth() && 
                         currentDate.getFullYear() === new Date().getFullYear();

          return (
            <div 
              key={index} 
              className={`min-h-[100px] border-b border-r border-slate-100 p-2 transition hover:bg-slate-50/50 relative ${
                !day ? 'bg-slate-50/30' : ''
              } ${isToday ? 'bg-indigo-50/30' : ''}`}
            >
              {day && (
                <>
                  <span className={`text-sm font-medium mb-1 block w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}>
                    {day}
                  </span>
                  <div className="space-y-1">
                    {dayInterviews.map(app => (
                      <div 
                        key={app.id}
                        className={`text-xs p-1.5 rounded border border-transparent hover:border-black/10 group cursor-pointer hover:shadow-sm transition ${STATUS_COLORS[app.status]}`}
                        title={`${app.companyName} - ${app.roleTitle} (${app.status})`}
                      >
                        <div className="font-semibold truncate">{app.companyName}</div>
                        <div className="flex items-center gap-1 opacity-90">
                          <Clock size={10} />
                          {new Date(app.nextInterviewDate!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Color Key / Legend */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1 text-slate-500 font-semibold uppercase tracking-wider">
          <Info size={14} /> Key:
        </div>
        {legendStatuses.map(status => (
           <div key={status} className={`flex items-center gap-1.5 px-2 py-1 rounded-full border border-black/5 ${STATUS_COLORS[status]}`}>
             <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></div>
             {status}
           </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;