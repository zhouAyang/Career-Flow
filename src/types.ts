export interface ResumeItem {
  id: string;
  name: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
}

export interface WorkspaceState {
  currentStep: number;
  selectedResumeId: string | null;
  jobInfo: {
    company: string;
    position: string;
    jdText: string;
  };
  modifiedContent: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  answer?: string;
  feedback?: string;
}

export interface ContentSession {
  id: string;
  company: string;
  role: string;
  jd: string;
  resumeId: string;
  matchResult: {
    score: number;
    pros: string[];
    gaps: string[];
    suggestions: string[];
  };
  interviewQuestions: InterviewQuestion[];
  modifiedContent: string;
  createdAt: string;
}

export type ApplicationStatus = '已投递' | '笔试中' | '一面' | '二面' | 'Offer' | 'Rejected' | '已结束';

export interface TimelineEntry {
  id: string;
  status: ApplicationStatus;
  date: string;
  note: string;
}

export interface ApplicationItem {
  id: string;
  company: string;
  position: string;
  channel: string;
  status: ApplicationStatus;
  applyDate: string;
  interviewDate?: string;
  notes: string;
  timeline: TimelineEntry[];
  updatedAt: string;
}

export interface UserSettings {
  userName: string;
  email: string;
  avatar?: string;
  theme: 'light' | 'dark';
}
