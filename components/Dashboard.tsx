import React from 'react';
import { JobApplication, ApplicationStatus } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from 'recharts';
import { STATUS_COLORS } from '../constants';
import { Building2 } from 'lucide-react';

interface DashboardProps {
  applications: JobApplication[];
}

const Dashboard: React.FC<DashboardProps> = ({ applications }) => {
  // Calculate Stats
  const total = applications.length;
  const active = applications.filter(a => 
    a.status !== ApplicationStatus.REJECTED && 
    a.status !== ApplicationStatus.WITHDRAWN
  ).length;
  
  const upcomingInterviews = applications.filter(a => a.nextInterviewDate).sort((a, b) => 
    new Date(a.nextInterviewDate!).getTime() - new Date(b.nextInterviewDate!).getTime()
  );

  // Data for Chart (Pipeline Distribution)
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Define logical order for pipeline stages
  const PIPELINE_ORDER = [
    ApplicationStatus.SUBMITTED,
    ApplicationStatus.RECRUITER_SCREEN,
    ApplicationStatus.TECH_SCREEN,
    ApplicationStatus.HIRING_MANAGER,
    ApplicationStatus.ONSITE,
    ApplicationStatus.OFFER,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN
  ];

  const chartData = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status]
  })).sort((a, b) => {
    return PIPELINE_ORDER.indexOf(a.name as ApplicationStatus) - PIPELINE_ORDER.indexOf(b.name as ApplicationStatus);
  });

  // Simple palette for charts
  const COLORS = ['#60A5FA', '#818CF8', '#A78BFA', '#E879F9', '#FB923C', '#4ADE80', '#F87171', '#9CA3AF'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Applications" value={total} icon="📄" />
        <StatCard title="Active Pipeline" value={active} icon="🔥" />
        <StatCard title="Upcoming Interviews" value={upcomingInterviews.length} icon="📅" />
        <StatCard title="Response Rate" value={`${Math.round((active / (total || 1)) * 100)}%`} icon="📈" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Visual */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Pipeline Distribution</h3>
          {/* Added w-full and min-w-0 to ensure grid item sizing works for Recharts */}
          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150} 
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc', radius: 4 }} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[PIPELINE_ORDER.indexOf(entry.name as ApplicationStatus) % COLORS.length]} />
                  ))}
                  <LabelList dataKey="value" position="right" fill="#64748b" fontSize={14} fontWeight="bold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Interviews List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Upcoming Interviews</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {upcomingInterviews.length === 0 ? (
              <p className="text-slate-400 italic">No upcoming interviews scheduled.</p>
            ) : (
              upcomingInterviews.map(app => (
                <div key={app.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 transition hover:border-slate-300">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {app.logoUrl ? (
                            <img 
                                src={app.logoUrl} 
                                alt={app.companyName} 
                                className="w-full h-full object-contain" 
                                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('bg-slate-50'); }}
                            />
                        ) : <Building2 size={18} className="text-slate-300" />}
                     </div>
                    <div>
                        <p className="font-medium text-slate-800">{app.companyName}</p>
                        <p className="text-sm text-slate-500">{app.roleTitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs px-2 py-1 rounded-full inline-block mb-1 ${STATUS_COLORS[app.status]}`}>
                      {app.status}
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      {new Date(app.nextInterviewDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number | string; icon: string }> = ({ title, value, icon }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl">
      {icon}
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

export default Dashboard;