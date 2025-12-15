import React from 'react';
import { LayoutDashboard, Briefcase, Mail, Calendar, Settings, ShieldCheck, Zap } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in pb-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">About Job Hunt Tracker</h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
          A comprehensive tool designed to organize your job search, visualize your progress, and manage recruiter communications in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
            <LayoutDashboard size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Dashboard Insights</h3>
          <p className="text-slate-600 leading-relaxed">
            Get a high-level view of your job search health. Track total applications, response rates, and visualize your pipeline distribution from submission to offer.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
            <Briefcase size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Application Tracking</h3>
          <p className="text-slate-600 leading-relaxed">
            Manage all your applications in a centralized list. Update statuses, add detailed notes, record recruiter info, and never lose track of a job link again.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4">
            <Calendar size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Interview Scheduling</h3>
          <p className="text-slate-600 leading-relaxed">
            Keep track of upcoming dates. The Calendar and Upcoming Interviews views ensure you're always prepared for the next screen or onsite loop.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600 mb-4">
            <Mail size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Smart Inbox</h3>
          <p className="text-slate-600 leading-relaxed">
            Connect your Gmail or LinkedIn accounts. The app scans for recruiter keywords and helps you link emails directly to specific job applications.
          </p>
        </div>
      </div>

      <div className="bg-indigo-50 rounded-2xl p-8 border border-indigo-100">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="text-indigo-600 fill-current" size={28} />
          <h2 className="text-2xl font-bold text-slate-900">How to Use</h2>
        </div>
        
        <div className="space-y-6">
          <div className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white text-indigo-600 font-bold flex items-center justify-center border border-indigo-200 shadow-sm">1</span>
            <div>
              <h4 className="font-bold text-slate-800 mb-1">Add Applications</h4>
              <p className="text-slate-600">Go to the <strong>Applications</strong> tab and click "New" to manually add jobs you've applied for. Include the role title, company, and job link.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white text-indigo-600 font-bold flex items-center justify-center border border-indigo-200 shadow-sm">2</span>
            <div>
              <h4 className="font-bold text-slate-800 mb-1">Connect Accounts</h4>
              <p className="text-slate-600">Navigate to <strong>Accounts</strong> and connect your Gmail or LinkedIn. This enables the app to find relevant messages.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white text-indigo-600 font-bold flex items-center justify-center border border-indigo-200 shadow-sm">3</span>
            <div>
              <h4 className="font-bold text-slate-800 mb-1">Process Inbound Messages</h4>
              <p className="text-slate-600">Check the <strong>Messages</strong> tab. Use the "Link to Application" feature to associate a recruiter's email with an existing job in your tracker.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white text-indigo-600 font-bold flex items-center justify-center border border-indigo-200 shadow-sm">4</span>
            <div>
              <h4 className="font-bold text-slate-800 mb-1">Update Statuses</h4>
              <p className="text-slate-600">As you progress, update the status of your applications (e.g., from "Recruiter Screen" to "Onsite"). This automatically updates your Dashboard charts.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-8 text-center">
         <div className="inline-flex items-center gap-2 text-slate-400 text-sm mb-2">
            <ShieldCheck size={16} />
            <span>Privacy Focused</span>
         </div>
         <p className="text-slate-500 text-sm">
           This application runs locally in your browser. Account tokens and personal data are not shared with third parties.
         </p>
         <p className="text-slate-400 text-xs mt-4">
           Version 1.0.0 &bull; Built with React & Tailwind
         </p>
      </div>
    </div>
  );
};

export default AboutPage;
