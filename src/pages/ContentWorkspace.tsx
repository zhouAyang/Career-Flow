import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  FileText, 
  Building2, 
  Target, 
  AlertCircle,
  Wand2,
  Zap,
  MessageSquare,
  ArrowRight,
  RotateCcw,
  BarChart3,
  Trash2,
  Plus,
  History,
  Clock,
  Search,
  MoreVertical,
  X,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { SafeInput, SafeTextarea } from '../components/ui/SafeInput';
import { storage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/storageKeys';
import { aiService } from '../services/aiService';
import { ResumeItem, WorkspaceState, ContentSession, InterviewQuestion } from '../types';

const INITIAL_WORKSPACE_STATE: WorkspaceState = {
  currentStep: 0,
  selectedResumeId: null,
  jobInfo: {
    company: '',
    position: '',
    jdText: '',
  },
  modifiedContent: '',
};

// --- Step Sub-components (Moved outside to prevent re-creation) ---

const Step1SelectResume = ({ 
  resumes, 
  selectedResumeId, 
  onSelect, 
  onNext 
}: { 
  resumes: ResumeItem[], 
  selectedResumeId: string | null, 
  onSelect: (id: string) => void, 
  onNext: () => void 
}) => (
  <div className="space-y-6">
    <div className="text-center space-y-2">
      <h2 className="text-2xl font-bold text-gray-900">选择一份简历开始优化</h2>
      <p className="text-gray-500">我们将基于这份简历进行后续的 AI 匹配与内容生成</p>
    </div>

    {resumes.length === 0 ? (
      <EmptyState 
        icon={FileText}
        title="尚未上传简历"
        description="在开始分析之前，请先上传至少一份简历资产。"
        action={
          <Link 
            to="/resume"
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all inline-flex items-center gap-2"
          >
            前往上传简历 <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resumes.map(resume => (
          <button
            key={resume.id}
            onClick={() => onSelect(resume.id)}
            className={`p-6 rounded-2xl border-2 text-left transition-all ${
              selectedResumeId === resume.id 
                ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50' 
                : 'border-gray-100 bg-white hover:border-blue-200'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                selectedResumeId === resume.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{resume.name}</p>
                <p className="text-xs text-gray-500 uppercase mt-1">{resume.fileType} • {new Date(resume.uploadDate).toLocaleDateString()}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    )}

    <div className="flex justify-end pt-6">
      <button
        disabled={!selectedResumeId}
        onClick={onNext}
        className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
      >
        下一步 <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const Step2InputJD = ({ 
  jobInfo, 
  onUpdate, 
  onPrev, 
  onStartAnalysis, 
  isAnalyzing 
}: { 
  jobInfo: WorkspaceState['jobInfo'], 
  onUpdate: (info: Partial<WorkspaceState['jobInfo']>) => void, 
  onPrev: () => void, 
  onStartAnalysis: () => void, 
  isAnalyzing: boolean 
}) => (
  <div className="space-y-8 max-w-3xl mx-auto">
    <div className="text-center space-y-2">
      <h2 className="text-2xl font-bold text-gray-900">输入目标职位信息</h2>
      <p className="text-gray-500">AI 将根据 JD 内容分析简历的匹配度并提供修改建议</p>
    </div>

    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">公司名称</label>
          <SafeInput 
            type="text" 
            placeholder="例如：Google"
            value={jobInfo.company}
            onValueChange={(val) => onUpdate({ company: val })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">岗位名称</label>
          <SafeInput 
            type="text" 
            placeholder="例如：高级前端工程师"
            value={jobInfo.position}
            onValueChange={(val) => onUpdate({ position: val })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700">职位描述 (JD)</label>
        <SafeTextarea 
          placeholder="粘贴职位要求、职责描述等内容..."
          value={jobInfo.jdText}
          onValueChange={(val) => onUpdate({ jdText: val })}
          className="w-full h-64 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
        />
      </div>
    </div>

    <div className="flex justify-between pt-6">
      <button onClick={onPrev} className="text-gray-600 font-bold px-6 py-3 flex items-center gap-2 hover:text-gray-900">
        <ChevronLeft className="w-4 h-4" /> 上一步
      </button>
      <button
        disabled={!jobInfo.company || !jobInfo.position || !jobInfo.jdText || isAnalyzing}
        onClick={onStartAnalysis}
        className="bg-blue-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
      >
        {isAnalyzing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            AI 分析中...
          </>
        ) : (
          <>开始 AI 匹配分析 <Sparkles className="w-4 h-4" /></>
        )}
      </button>
    </div>
  </div>
);

const Step3Analysis = ({ 
  activeSession, 
  company, 
  position, 
  onPrev, 
  onNext 
}: { 
  activeSession: ContentSession | undefined, 
  company: string, 
  position: string, 
  onPrev: () => void, 
  onNext: () => void 
}) => {
  const data = activeSession?.matchResult || { score: 0, pros: [], gaps: [], suggestions: [] };
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">JD 匹配分析报告</h2>
          <p className="text-gray-500">基于您的简历与 {company} - {position} 岗位的匹配结果</p>
        </div>
        <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-right">
            <p className="text-xs font-bold text-gray-400 uppercase">匹配得分</p>
            <p className="text-2xl font-black text-blue-600">{data.score}<span className="text-sm text-gray-400">/100</span></p>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 flex items-center justify-center">
            <Target className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" /> 核心优势
            </h3>
            <ul className="space-y-4">
              {data.pros.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-600 leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" /> 关键缺口
            </h3>
            <ul className="space-y-4">
              {data.gaps.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-600 leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0"></div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white space-y-8 relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              <h3 className="text-xl font-bold">AI 优化建议</h3>
            </div>
            <div className="space-y-6">
              {data.suggestions.map((suggestion, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                  <p className="text-sm font-bold mb-2">优化建议 #{i + 1}</p>
                  <p className="text-sm text-blue-100 leading-relaxed">
                    {suggestion}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <Zap className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button onClick={onPrev} className="text-gray-600 font-bold px-6 py-3 flex items-center gap-2 hover:text-gray-900">
          <ChevronLeft className="w-4 h-4" /> 上一步
        </button>
        <button
          onClick={onNext}
          className="bg-gray-900 text-white px-10 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2"
        >
          进入简历修改 <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const Step4Suggestions = ({ 
  activeSession,
  onPrev, 
  onNext 
}: { 
  activeSession: ContentSession | undefined, 
  onPrev: () => void, 
  onNext: () => void 
}) => {
  const suggestions = activeSession?.optimizationResult;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // In a real app, we might show a toast here
  };

  const SuggestionCard = ({ original, suggested }: { original: string, suggested: string, key?: any }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 hover:shadow-md transition-all group">
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">原句</p>
        <p className="text-sm text-gray-500 leading-relaxed">{original}</p>
      </div>
      <div className="h-px bg-gray-50 w-full"></div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">建议改写为</p>
          <button 
            onClick={() => copyToClipboard(suggested)}
            className="text-[10px] font-bold text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
          >
            <CheckCircle2 className="w-3 h-3" /> 复制建议
          </button>
        </div>
        <p className="text-sm text-gray-900 font-medium leading-relaxed">{suggested}</p>
      </div>
    </div>
  );

  const Section = ({ title, items, icon: Icon }: { title: string, items: any[] | undefined, icon: any }) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Icon className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="font-bold text-gray-900">{title}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item, i) => (
            <SuggestionCard key={i} original={item.original} suggested={item.suggested} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">简历优化建议</h2>
        <p className="text-gray-500">AI 已根据目标岗位要求，为您生成了以下针对性的优化建议</p>
      </div>

      {!suggestions ? (
        <div className="py-20 text-center space-y-4 bg-white rounded-[2.5rem] border border-gray-100">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
            <Wand2 className="w-8 h-8 text-gray-200" />
          </div>
          <p className="text-gray-400">暂无优化建议，请重新开始分析</p>
        </div>
      ) : (
        <div className="space-y-12">
          <Section title="实习经历" items={suggestions.internship} icon={Briefcase} />
          <Section title="项目经历" items={suggestions.projects} icon={Zap} />
          <Section title="技能/工具" items={suggestions.skills} icon={Target} />
          
          {suggestions.overall && suggestions.overall.length > 0 && (
            <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white space-y-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h3 className="text-xl font-bold">整体改进建议</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {suggestions.overall.map((item, i) => (
                  <div key={i} className="flex gap-4 p-6 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-blue-400 font-black text-2xl opacity-50">0{i+1}</span>
                    <p className="text-sm text-gray-300 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between pt-6">
        <button onClick={onPrev} className="text-gray-600 font-bold px-6 py-3 flex items-center gap-2 hover:text-gray-900">
          <ChevronLeft className="w-4 h-4" /> 上一步
        </button>
        <button
          onClick={onNext}
          className="bg-gray-900 text-white px-10 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2"
        >
          准备面试问题 <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const Step5Interview = ({ 
  activeSession, 
  onAddMore, 
  isGeneratingQuestions, 
  activeQuestionIndex, 
  onSelectQuestion, 
  userAnswer, 
  onAnswerChange, 
  onReview, 
  isReviewing, 
  reviewResult, 
  onPrev, 
  onFinish 
}: { 
  activeSession: ContentSession | undefined, 
  onAddMore: (type?: 'jd' | 'company' | 'resume') => void, 
  isGeneratingQuestions: boolean, 
  activeQuestionIndex: number, 
  onSelectQuestion: (i: number) => void, 
  userAnswer: string, 
  onAnswerChange: (val: string) => void, 
  onReview: () => void, 
  isReviewing: boolean, 
  reviewResult: { feedback: string; tags: string[] } | null, 
  onPrev: () => void, 
  onFinish: () => void 
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const getTagInfo = (type: string) => {
    switch (type) {
      case 'jd': return { label: '岗位', color: 'bg-blue-50 text-blue-600 border-blue-100' };
      case 'company': return { label: '公司', color: 'bg-purple-50 text-purple-600 border-purple-100' };
      case 'resume': return { label: '简历', color: 'bg-green-50 text-green-600 border-green-100' };
      default: return { label: '通用', color: 'bg-gray-50 text-gray-600 border-gray-100' };
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">面试准备助手</h2>
          <p className="text-gray-500">基于岗位要求与您的简历，AI 为您预测了以下面试问题</p>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowAddMenu(!showAddMenu)}
            disabled={isGeneratingQuestions}
            className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all disabled:opacity-50"
          >
            {isGeneratingQuestions ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Plus className="w-4 h-4" />
            )}
            追加更多问题
          </button>

          <AnimatePresence>
            {showAddMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50"
              >
                {[
                  { type: 'jd', label: '岗位相关问题', icon: Building2 },
                  { type: 'company', label: '公司相关问题', icon: Target },
                  { type: 'resume', label: '简历相关问题', icon: FileText },
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => {
                      onAddMore(item.type as any);
                      setShowAddMenu(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    <item.icon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-200">
            {activeSession?.interviewQuestions.map((q, i) => {
              const tag = getTagInfo(q.type);
              return (
                <button 
                  key={q.id}
                  onClick={() => onSelectQuestion(i)}
                  className={`w-full p-5 rounded-2xl border text-left transition-all ${
                    activeQuestionIndex === i ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100' : 'border-gray-100 bg-white hover:border-blue-200 shadow-sm'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${tag.color}`}>
                        {tag.label}
                      </span>
                      <span className="text-[10px] font-bold text-gray-300">Q{i + 1}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 leading-relaxed">{q.question}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">回答练习</h3>
              <p className="text-xs text-gray-400">针对问题：{activeSession?.interviewQuestions[activeQuestionIndex]?.question}</p>
            </div>
            <SafeTextarea 
              className="w-full h-48 p-6 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 leading-relaxed resize-none"
              placeholder="在这里输入您的回答思路或完整答案..."
              value={userAnswer}
              onValueChange={onAnswerChange}
            />
            <div className="flex justify-end">
              <button 
                disabled={!userAnswer.trim() || isReviewing}
                onClick={onReview}
                className="bg-gray-900 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isReviewing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                获取 AI 点评
              </button>
            </div>

            {reviewResult && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-blue-50 rounded-2xl border border-blue-100 space-y-4"
              >
                <div className="flex items-center gap-2 text-blue-600">
                  <MessageSquare className="w-4 h-4" />
                  <span className="font-bold text-sm">AI 点评反馈</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed italic">
                  "{reviewResult.feedback}"
                </p>
                <div className="flex flex-wrap gap-2">
                  {reviewResult.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-white text-blue-600 rounded-full text-xs font-bold border border-blue-100">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-10 border-t border-gray-100">
        <button onClick={onPrev} className="text-gray-600 font-bold px-6 py-3 flex items-center gap-2 hover:text-gray-900">
          <ChevronLeft className="w-4 h-4" /> 上一步
        </button>
        <button 
          onClick={onFinish}
          className="bg-blue-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          完成并返回首页
        </button>
      </div>
    </div>
  );
};

const ContentWorkspace = () => {
  const [sessions, setSessions] = useState<ContentSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>(INITIAL_WORKSPACE_STATE);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<{ feedback: string; tags: string[] } | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const navigate = useNavigate();

  // Load data
  useEffect(() => {
    const savedResumes = storage.getData<ResumeItem[]>(STORAGE_KEYS.RESUMES) || [];
    setResumes(savedResumes);

    const savedSessions = storage.getData<ContentSession[]>(STORAGE_KEYS.SESSIONS) || [];
    setSessions(savedSessions);

    const savedWorkspace = storage.getData<WorkspaceState>(STORAGE_KEYS.WORKSPACE);
    if (savedWorkspace) {
      setWorkspaceState(savedWorkspace);
    }
  }, []);

  // Persist sessions
  useEffect(() => {
    storage.setData(STORAGE_KEYS.SESSIONS, sessions);
  }, [sessions]);

  // Persist workspace state
  useEffect(() => {
    storage.setData(STORAGE_KEYS.WORKSPACE, workspaceState);
  }, [workspaceState]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const steps = [
    { id: 0, title: '选择简历', icon: FileText },
    { id: 1, title: '输入 JD', icon: Building2 },
    { id: 2, title: '匹配分析', icon: Target },
    { id: 3, title: '优化建议', icon: Wand2 },
    { id: 4, title: '面试准备', icon: MessageSquare },
  ];

  const nextStep = () => setWorkspaceState(prev => ({ ...prev, currentStep: Math.min(prev.currentStep + 1, steps.length - 1) }));
  const prevStep = () => setWorkspaceState(prev => ({ ...prev, currentStep: Math.max(prev.currentStep - 1, 0) }));

  const startNewAnalysis = () => {
    setActiveSessionId(null);
    setWorkspaceState(INITIAL_WORKSPACE_STATE);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这条分析记录吗？')) {
      setSessions(prev => prev.filter(s => s.id !== id));
      if (activeSessionId === id) {
        startNewAnalysis();
      }
    }
  };

  const selectSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setActiveSessionId(id);
      setWorkspaceState({
        currentStep: 2, // Default to analysis step when viewing history
        selectedResumeId: session.resumeId,
        jobInfo: {
          company: session.company,
          position: session.role,
          jdText: session.jd,
        },
        modifiedContent: session.modifiedContent,
      });
    }
  };

  const createSession = async () => {
    const selectedResume = resumes.find(r => r.id === workspaceState.selectedResumeId);
    const resumeContext = selectedResume 
      ? `简历名称: ${selectedResume.name}\n文件类型: ${selectedResume.fileType}\n(此处在真实应用中应为解析后的文件全文内容)`
      : "这是简历的原始文本内容...";
    
    // Run analysis and suggestions in parallel
    const [matchResult, optimizationResult, interviewQuestions] = await Promise.all([
      aiService.analyzeJDMatch(resumeContext, workspaceState.jobInfo.jdText),
      aiService.generateResumeSuggestions(resumeContext, workspaceState.jobInfo.jdText),
      aiService.generateInterviewQuestions(resumeContext, workspaceState.jobInfo.jdText)
    ]);

    const newSession: ContentSession = {
      id: Math.random().toString(36).substr(2, 9),
      company: workspaceState.jobInfo.company,
      role: workspaceState.jobInfo.position,
      jd: workspaceState.jobInfo.jdText,
      resumeId: workspaceState.selectedResumeId!,
      matchResult,
      optimizationResult,
      interviewQuestions,
      modifiedContent: resumeContext,
      createdAt: new Date().toISOString(),
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setWorkspaceState(prev => ({ ...prev, modifiedContent: newSession.modifiedContent }));
  };

  const addMoreQuestions = async (type?: 'jd' | 'company' | 'resume') => {
    if (!activeSessionId || !activeSession) return;
    
    setIsGeneratingQuestions(true);
    try {
      const moreQuestions = await aiService.generateInterviewQuestions(
        activeSession.modifiedContent, 
        activeSession.jd, 
        type,
        3
      );
      
      setSessions(prev => prev.map(s => 
        s.id === activeSessionId 
          ? { ...s, interviewQuestions: [...s.interviewQuestions, ...moreQuestions] }
          : s
      ));
    } catch (error) {
      console.error('Failed to generate more questions:', error);
      alert('生成问题失败，请稍后重试');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // --- Step Components (Removed from here) ---

  return (
    <div className="space-y-10">
      <PageHeader 
        title="求职内容工作台" 
        description="AI 驱动的简历优化与面试准备，助您精准匹配目标岗位"
        action={
          <button 
            onClick={startNewAnalysis}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
          >
            <Plus className="w-5 h-5" /> 新建分析
          </button>
        }
      />

      <div className="flex gap-8 min-h-[calc(100vh-280px)]">
        {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden lg:flex flex-col bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm shrink-0"
          >
          <div className="p-6 border-b border-gray-50 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="搜索记录..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-100"
              />
            </div>
          </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
              <div className="flex items-center gap-2 px-2 mb-2">
                <History className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">历史记录</span>
              </div>
              
              {sessions.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">暂无分析记录</p>
                </div>
              ) : (
                sessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => selectSession(session.id)}
                    className={`w-full p-4 rounded-2xl text-left transition-all group relative ${
                      activeSessionId === session.id 
                        ? 'bg-blue-50 border border-blue-100' 
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="space-y-1 pr-6">
                      <p className={`text-sm font-bold truncate ${activeSessionId === session.id ? 'text-blue-700' : 'text-gray-900'}`}>
                        {session.company}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{session.role}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-gray-400 font-medium">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => deleteSession(e, session.id)}
                      className="absolute top-4 right-4 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </button>
                ))
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 space-y-10 min-w-0">
        {/* Stepper Header */}
        <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm overflow-x-auto no-scrollbar flex items-center gap-4">
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg lg:flex hidden"
          >
            <History className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-between flex-1 min-w-[700px] px-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isCompleted = workspaceState.currentStep > i;
              const isActive = workspaceState.currentStep === i;
              
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center gap-2 relative">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' : 
                      isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-300'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={`text-[10px] font-bold whitespace-nowrap ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-500 ${
                      isCompleted ? 'bg-green-200' : 'bg-gray-100'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={workspaceState.currentStep + (activeSessionId || 'new')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {workspaceState.currentStep === 0 && (
              <Step1SelectResume 
                resumes={resumes}
                selectedResumeId={workspaceState.selectedResumeId}
                onSelect={(id) => setWorkspaceState(prev => ({ ...prev, selectedResumeId: id }))}
                onNext={nextStep}
              />
            )}
            {workspaceState.currentStep === 1 && (
              <Step2InputJD 
                jobInfo={workspaceState.jobInfo}
                onUpdate={(info) => setWorkspaceState(prev => ({ ...prev, jobInfo: { ...prev.jobInfo, ...info } }))}
                onPrev={prevStep}
                onStartAnalysis={async () => {
                  setIsAnalyzing(true);
                  try {
                    await createSession();
                    nextStep();
                  } catch (error) {
                    console.error('Analysis failed:', error);
                    alert('分析失败，请稍后重试');
                  } finally {
                    setIsAnalyzing(false);
                  }
                }}
                isAnalyzing={isAnalyzing}
              />
            )}
            {workspaceState.currentStep === 2 && (
              <Step3Analysis 
                activeSession={activeSession}
                company={workspaceState.jobInfo.company}
                position={workspaceState.jobInfo.position}
                onPrev={prevStep}
                onNext={nextStep}
              />
            )}
            {workspaceState.currentStep === 3 && (
              <Step4Suggestions 
                activeSession={activeSession}
                onPrev={prevStep}
                onNext={nextStep}
              />
            )}
            {workspaceState.currentStep === 4 && (
              <Step5Interview 
                activeSession={activeSession}
                onAddMore={addMoreQuestions}
                isGeneratingQuestions={isGeneratingQuestions}
                activeQuestionIndex={activeQuestionIndex}
                onSelectQuestion={(i) => {
                  setActiveQuestionIndex(i);
                  setReviewResult(null);
                  setUserAnswer('');
                }}
                userAnswer={userAnswer}
                onAnswerChange={(val) => setUserAnswer(val)}
                onReview={async () => {
                  setIsReviewing(true);
                  try {
                    const result = await aiService.reviewInterviewAnswer(
                      activeSession?.interviewQuestions[activeQuestionIndex]?.question || "", 
                      userAnswer
                    );
                    setReviewResult(result);
                  } catch (error) {
                    console.error('Review failed:', error);
                    alert('获取点评失败，请稍后重试');
                  } finally {
                    setIsReviewing(false);
                  }
                }}
                isReviewing={isReviewing}
                reviewResult={reviewResult}
                onPrev={prevStep}
                onFinish={() => navigate('/')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
    </div>
  );
};

export default ContentWorkspace;
