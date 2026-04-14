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
  type: 'jd' | 'company' | 'resume';
  answer?: string;
  feedback?: string;
}

export interface ResumeOptimizationLeftPanel {
  section: string;
  original_text: string;
  issue: string;
  revised_text: string;
  grounded: boolean;
  note: string;
}

export interface ResumeOptimizationRightPanel {
  jd_keyword: string;
  jd_reason: string;
  matched_resume_section: string;
  matched_resume_evidence: string;
  suggestion: string;
  safe_to_add: 'yes' | 'no';
}

export interface ResumeOptimizationResult {
  left_panel: ResumeOptimizationLeftPanel[];
  right_panel: ResumeOptimizationRightPanel[];
  overall_note: string;
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
  optimizationResult?: ResumeOptimizationResult;
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
