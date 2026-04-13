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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
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

const ContentWorkspace = () => {
  const [sessions, setSessions] = useState<ContentSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>(INITIAL_WORKSPACE_STATE);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
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
    { id: 3, title: '简历修改', icon: Wand2 },
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
    // In a real app, we would fetch the actual resume content here
    const mockResumeContent = "这是简历的原始文本内容...";
    
    const matchResult = await aiService.analyzeJDMatch(
      mockResumeContent, 
      workspaceState.jobInfo.jdText
    );

    const interviewQuestions = await aiService.generateInterviewQuestions(
      mockResumeContent,
      workspaceState.jobInfo.jdText
    );

    const newSession: ContentSession = {
      id: Math.random().toString(36).substr(2, 9),
      company: workspaceState.jobInfo.company,
      role: workspaceState.jobInfo.position,
      jd: workspaceState.jobInfo.jdText,
      resumeId: workspaceState.selectedResumeId!,
      matchResult,
      interviewQuestions,
      modifiedContent: '这里是您的简历原始内容...\n\n工作经历：\n- 负责前端架构设计...\n- 优化页面性能...',
      createdAt: new Date().toISOString(),
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setWorkspaceState(prev => ({ ...prev, modifiedContent: newSession.modifiedContent }));
  };

  const addMoreQuestions = async () => {
    if (!activeSessionId) return;
    
    // In a real app, we'd pass context to get better questions
    const moreQuestions = await aiService.generateInterviewQuestions("", "", 2);
    
    setSessions(prev => prev.map(s => 
      s.id === activeSessionId 
        ? { ...s, interviewQuestions: [...s.interviewQuestions, ...moreQuestions] }
        : s
    ));
  };

  // --- Step Components ---

  const Step1SelectResume = () => (
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
              onClick={() => setWorkspaceState(prev => ({ ...prev, selectedResumeId: resume.id }))}
              className={`p-6 rounded-2xl border-2 text-left transition-all ${
                workspaceState.selectedResumeId === resume.id 
                  ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50' 
                  : 'border-gray-100 bg-white hover:border-blue-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  workspaceState.selectedResumeId === resume.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
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
          disabled={!workspaceState.selectedResumeId}
          onClick={nextStep}
          className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          下一步 <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const Step2InputJD = () => (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">输入目标职位信息</h2>
        <p className="text-gray-500">AI 将根据 JD 内容分析简历的匹配度并提供修改建议</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">公司名称</label>
            <input 
              type="text" 
              placeholder="例如：Google"
              value={workspaceState.jobInfo.company}
              onChange={(e) => setWorkspaceState(prev => ({ ...prev, jobInfo: { ...prev.jobInfo, company: e.target.value } }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">岗位名称</label>
            <input 
              type="text" 
              placeholder="例如：高级前端工程师"
              value={workspaceState.jobInfo.position}
              onChange={(e) => setWorkspaceState(prev => ({ ...prev, jobInfo: { ...prev.jobInfo, position: e.target.value } }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">职位描述 (JD)</label>
          <textarea 
            placeholder="粘贴职位要求、职责描述等内容..."
            value={workspaceState.jobInfo.jdText}
            onChange={(e) => setWorkspaceState(prev => ({ ...prev, jobInfo: { ...prev.jobInfo, jdText: e.target.value } }))}
            className="w-full h-64 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
          />
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button onClick={prevStep} className="text-gray-600 font-bold px-6 py-3 flex items-center gap-2 hover:text-gray-900">
          <ChevronLeft className="w-4 h-4" /> 上一步
        </button>
        <button
          disabled={!workspaceState.jobInfo.company || !workspaceState.jobInfo.position || !workspaceState.jobInfo.jdText}
          onClick={async () => {
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

  const Step3Analysis = () => {
    const data = activeSession?.matchResult || { score: 0, pros: [], gaps: [], suggestions: [] };
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">JD 匹配分析报告</h2>
            <p className="text-gray-500">基于您的简历与 {workspaceState.jobInfo.company} - {workspaceState.jobInfo.position} 岗位的匹配结果</p>
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
          <button onClick={prevStep} className="text-gray-600 font-bold px-6 py-3 flex items-center gap-2 hover:text-gray-900">
            <ChevronLeft className="w-4 h-4" /> 上一步
          </button>
          <button
            onClick={nextStep}
            className="bg-gray-900 text-white px-10 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2"
          >
            进入简历修改 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const Step4Edit = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">简历内容修改</h2>
          <p className="text-gray-500">根据 AI 建议调整内容，使其更符合 {workspaceState.jobInfo.position} 岗位要求</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 text-gray-500 hover:text-gray-900 px-4 py-2 font-bold text-sm">
            <RotateCcw className="w-4 h-4" /> 还原
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
            <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Resume Editor</span>
              <div className="w-12"></div>
            </div>
            <textarea 
              value={workspaceState.modifiedContent}
              onChange={(e) => {
                const newContent = e.target.value;
                setWorkspaceState(prev => ({ ...prev, modifiedContent: newContent }));
                if (activeSessionId) {
                  setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, modifiedContent: newContent } : s));
                }
              }}
              className="flex-1 p-10 outline-none text-gray-800 leading-relaxed text-lg resize-none"
              placeholder="开始编辑您的简历内容..."
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-blue-600">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-bold">AI 快捷操作</h3>
            </div>

            <div className="space-y-3">
              {[
                { label: '更精炼', desc: '去除冗余，保持简洁', icon: Zap },
                { label: '更贴近岗位', desc: '强化 JD 关键词匹配', icon: Target },
                { label: '强调成果', desc: '自动挖掘并量化成果', icon: BarChart3 },
                { label: '弱化无关内容', desc: '折叠非核心经历', icon: Trash2 },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={async () => {
                    setIsOptimizing(true);
                    try {
                      const optimized = await aiService.optimizeResumeText(
                        workspaceState.modifiedContent,
                        action.label,
                        workspaceState.jobInfo.jdText
                      );
                      setWorkspaceState(prev => ({ ...prev, modifiedContent: optimized }));
                      if (activeSessionId) {
                        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, modifiedContent: optimized } : s));
                      }
                    } catch (error) {
                      console.error('Optimization failed:', error);
                    } finally {
                      setIsOptimizing(false);
                    }
                  }}
                  className="w-full p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <action.icon className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold text-gray-900">{action.label}</span>
                  </div>
                  <p className="text-xs text-gray-400">{action.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button onClick={prevStep} className="text-gray-600 font-bold px-6 py-3 flex items-center gap-2 hover:text-gray-900">
          <ChevronLeft className="w-4 h-4" /> 上一步
        </button>
        <button
          onClick={nextStep}
          className="bg-blue-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
        >
          {isOptimizing ? 'AI 处理中...' : '完成修改，准备面试'} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const Step5Interview = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">面试准备助手</h2>
          <p className="text-gray-500">基于岗位要求与您的简历，AI 为您预测了以下面试问题</p>
        </div>
        <button 
          onClick={addMoreQuestions}
          className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all"
        >
          <Plus className="w-4 h-4" /> 追加更多问题
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          {activeSession?.interviewQuestions.map((q, i) => (
            <button 
              key={q.id}
              className={`w-full p-5 rounded-2xl border text-left transition-all ${
                i === 0 ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100' : 'border-gray-100 bg-white hover:border-blue-200'
              }`}
            >
              <div className="flex gap-3">
                <span className="text-xs font-bold text-blue-600 bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm font-bold text-gray-900 leading-relaxed">{q.question}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
            <h3 className="font-bold text-gray-900">回答练习</h3>
            <textarea 
              className="w-full h-48 p-6 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 leading-relaxed resize-none"
              placeholder="在这里输入您的回答思路或完整答案..."
            />
            <div className="flex justify-end">
              <button 
                onClick={async () => {
                  // In a real app, we'd get the actual question and answer
                  const result = await aiService.reviewInterviewAnswer("示例问题", "示例回答");
                  alert(`AI 点评：\n${result.feedback}\n\n标签：${result.tags.join(', ')}`);
                }}
                className="bg-gray-900 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2"
              >
                获取 AI 点评 <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-purple-50 rounded-3xl p-8 border border-purple-100 space-y-4">
            <div className="flex items-center gap-2 text-purple-700">
              <MessageSquare className="w-5 h-5" />
              <h3 className="font-bold">AI 点评建议 (示例)</h3>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-purple-900 leading-relaxed font-medium">
                “您的回答涵盖了技术细节，但建议增加更多关于‘为什么这么做’的思考。例如在提到性能优化时，可以先说明当时遇到的具体业务痛点（如首屏加载超过 5s），然后再引出优化手段和最终量化结果。”
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">逻辑清晰</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">建议增加量化数据</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-10 border-t border-gray-100">
        <button onClick={prevStep} className="text-gray-600 font-bold px-6 py-3 flex items-center gap-2 hover:text-gray-900">
          <ChevronLeft className="w-4 h-4" /> 上一步
        </button>
        <button 
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          完成并返回首页
        </button>
      </div>
    </div>
  );

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
            {workspaceState.currentStep === 0 && <Step1SelectResume />}
            {workspaceState.currentStep === 1 && <Step2InputJD />}
            {workspaceState.currentStep === 2 && <Step3Analysis />}
            {workspaceState.currentStep === 3 && <Step4Edit />}
            {workspaceState.currentStep === 4 && <Step5Interview />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
    </div>
  );
};

export default ContentWorkspace;
