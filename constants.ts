import { ApplicationStatus, JobApplication, InboundMessage, ConnectedAccount } from './types';

// Helper to generate dynamic dates relative to today
const getRelativeDate = (daysOffset: number, hour: number = 9): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.SUBMITTED]: 'bg-blue-100 text-blue-800',
  [ApplicationStatus.RECRUITER_SCREEN]: 'bg-indigo-100 text-indigo-800',
  [ApplicationStatus.TECH_SCREEN]: 'bg-purple-100 text-purple-800',
  [ApplicationStatus.HIRING_MANAGER]: 'bg-fuchsia-100 text-fuchsia-800',
  [ApplicationStatus.ONSITE]: 'bg-orange-100 text-orange-800',
  [ApplicationStatus.OFFER]: 'bg-green-100 text-green-800',
  [ApplicationStatus.REJECTED]: 'bg-red-100 text-red-800',
  [ApplicationStatus.WITHDRAWN]: 'bg-slate-100 text-slate-800',
};

export const INITIAL_APPLICATIONS: JobApplication[] = [
  {
    id: '1',
    dateApplied: getRelativeDate(-14),
    companyName: 'TechCorp',
    logoUrl: 'https://logo.clearbit.com/google.com',
    roleTitle: 'Senior Frontend Engineer',
    jobLink: 'https://techcorp.jobs/123',
    jobDescription: 'We are looking for a Senior Frontend Engineer to join our core product team...',
    aiSkills: ['React', 'TypeScript', 'Performance Optimization'],
    status: ApplicationStatus.ONSITE,
    recruiter: { name: 'Sarah Jenkins', email: 'sarah@techcorp.com' },
    notes: [
      { id: 'n1', content: 'Great chat with hiring manager. Focused heavily on React performance.', date: getRelativeDate(-5) }
    ],
    nextInterviewDate: getRelativeDate(2, 14), // 2 days from now at 2 PM
    needsReview: false
  },
  {
    id: '2',
    dateApplied: getRelativeDate(-5),
    companyName: 'StartupInc',
    logoUrl: 'https://logo.clearbit.com/stripe.com',
    roleTitle: 'Full Stack Developer',
    jobLink: 'https://startup.io/careers',
    status: ApplicationStatus.TECH_SCREEN,
    recruiter: { name: 'Mike Chen', email: 'mike@startup.io' },
    notes: [],
    nextInterviewDate: getRelativeDate(5, 10), // 5 days from now at 10 AM
    needsReview: true
  },
  {
    id: '3',
    dateApplied: getRelativeDate(-20),
    companyName: 'BigData Systems',
    logoUrl: 'https://logo.clearbit.com/databricks.com',
    roleTitle: 'UI Engineer',
    jobLink: 'https://bigdata.com/jobs',
    status: ApplicationStatus.RECRUITER_SCREEN,
    recruiter: { name: 'Jessica Lee' },
    notes: [],
    nextInterviewDate: getRelativeDate(1, 11), // Tomorrow at 11 AM
  },
  {
    id: '4',
    dateApplied: getRelativeDate(-30),
    companyName: 'CloudNet',
    logoUrl: 'https://logo.clearbit.com/cloudflare.com',
    roleTitle: 'Frontend Architect',
    jobLink: '#',
    status: ApplicationStatus.OFFER,
    recruiter: { name: 'Tom Wilson' },
    notes: [{ id: 'n2', content: 'Received verbal offer. Waiting for written details.', date: getRelativeDate(-1) }],
  },
  {
    id: '5',
    dateApplied: getRelativeDate(-2),
    companyName: 'Designify',
    logoUrl: 'https://logo.clearbit.com/figma.com',
    roleTitle: 'Product Engineer',
    jobLink: '#',
    status: ApplicationStatus.SUBMITTED,
    notes: [],
  },
  {
    id: '6',
    dateApplied: getRelativeDate(-45),
    companyName: 'Legacy Bank',
    logoUrl: 'https://logo.clearbit.com/chase.com',
    roleTitle: 'Web Developer',
    jobLink: '#',
    status: ApplicationStatus.REJECTED,
    notes: [{ id: 'n3', content: 'Generic rejection email.', date: getRelativeDate(-40) }],
  }
];

export const NEW_INBOUND_MESSAGE: InboundMessage = {
  id: 'msg_new_1',
  threadId: 'th_1',
  accountId: 'acc_1',
  provider: 'Gmail',
  senderName: 'Emily Davis',
  senderEmail: 'emily.davis@innovate.tech',
  subject: 'Interview Availability - Innovate Tech',
  snippet: 'Hi Alex, we would like to schedule a technical screen with you next week...',
  fullBody: '<p>Hi Alex,</p><p>Thanks for your interest in <strong>Innovate Tech</strong>. We were impressed by your profile and would like to schedule a <strong>technical screen</strong> with the team next week.</p><p>Please let us know your availability for next Tuesday or Wednesday.</p><p>Best,<br>Emily</p>',
  rawContent: 'Date: Wed, 25 Oct 2023 10:30:00 -0700\nFrom: Emily Davis <emily.davis@innovate.tech>\nSubject: Interview Availability - Innovate Tech\n...',
  receivedAt: new Date().toISOString(),
  link: 'https://gmail.com/message/12345',
  isRead: false
};

export const MOCK_MESSAGES: InboundMessage[] = [
  {
    id: 'm1',
    threadId: 'th_2',
    accountId: 'acc_1',
    provider: 'Gmail',
    senderName: 'Sarah Jenkins',
    senderEmail: 'sarah@techcorp.com',
    subject: 'Update on your application at TechCorp',
    snippet: 'Hi Alex, just wanted to confirm your onsite interview for next Thursday...',
    fullBody: 'Hi Alex,<br><br>Just wanted to confirm your <strong>onsite interview</strong> for next Thursday at 2 PM. We are excited to meet you!<br><br>Best,<br>Sarah',
    rawContent: '...',
    receivedAt: getRelativeDate(-2, 15),
    link: '#',
    isRead: true,
    linkedApplicationId: '1'
  }
];

export const MOCK_ACCOUNTS: ConnectedAccount[] = [
  {
    id: 'acc_1',
    provider: 'Gmail',
    name: 'Alex Developer',
    email: 'alex.dev@gmail.com',
    accessToken: 'mock_token_1',
    refreshToken: 'mock_refresh_1',
    tokenExpiresAt: Date.now() + 3600000,
    status: 'Connected',
    lastSyncedAt: new Date().toISOString(),
    avatarUrl: 'https://ui-avatars.com/api/?name=Alex+Dev&background=EA4335&color=fff'
  }
];