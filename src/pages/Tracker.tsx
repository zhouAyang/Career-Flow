import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar, 
  Building2, 
  Briefcase, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ChevronRight,
  Trash2,
  Edit2,
  X,
  MessageSquare,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { storage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/storageKeys';
import { ApplicationItem, ApplicationStatus, TimelineEntry } from '../types';

const STATUS_CONFIG: Record<ApplicationStatus, { color: string, bg: string, icon: any }> = {
  '已投递': { color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock },
  '笔试中': { color: 'text-purple-600', bg: 'bg-purple-50', icon: Edit2 },
  '一面': { color: 'text-indigo-600', bg: 'bg-indigo-50', icon: MessageSquare },
  '二面': { color: 'text-indigo-700', bg: 'bg-indigo-100', icon: MessageSquare },
  'Offer': { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2 },
  'Rejected': { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
  '已结束': { color: 'text-gray-600', bg: 'bg-gray-50', icon: AlertCircle },
};

const Tracker = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<ApplicationItem>>({
    company: '',
    position: '',
    channel: '',
    status: '已投递',
    applyDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Load data
  useEffect(() => {
    const saved = storage.getData<ApplicationItem[]>(STORAGE_KEYS.APPLICATIONS) || [];
    setApplications(saved);
  }, []);

  // Persist data
  useEffect(() => {
    storage.setData(STORAGE_KEYS.APPLICATIONS, applications);
  }, [applications]);

  // Statistics
  const stats = useMemo(() => ({
    total: applications.length,
    interviewing: applications.filter(a => ['一面', '二面', '笔试中'].includes(a.status)).length,
    offers: applications.filter(a => a.status === 'Offer').length,
    ended: applications.filter(a => ['Rejected', '已结束'].includes(a.status)).length,
  }), [applications]);

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch = app.company.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           app.position.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [applications, searchQuery, statusFilter]);

  const handleSave = () => {
    if (!formData.company || !formData.position) return;

    if (selectedApp) {
      // Update existing
      const updatedApp: ApplicationItem = {
        ...selectedApp,
        ...formData,
        updatedAt: new Date().toISOString(),
      } as ApplicationItem;
      
      // If status changed, add to timeline
      if (formData.status !== selectedApp.status) {
        updatedApp.timeline = [
          {
            id: Math.random().toString(36).substr(2, 9),
            status: formData.status as ApplicationStatus,
            date: new Date().toISOString(),
            note: `状态更新为 ${formData.status}`,
          },
          ...selectedApp.timeline
        ];
      }

      setApplications(prev => prev.map(a => a.id === selectedApp.id ? updatedApp : a));
    } else {
      // Create new
      const newApp: ApplicationItem = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        timeline: [{
          id: Math.random().toString(36).substr(2, 9),
          status: formData.status as ApplicationStatus,
          date: new Date().toISOString(),
          note: '创建申请记录',
        }],
        updatedAt: new Date().toISOString(),
      } as ApplicationItem;
      setApplications(prev => [newApp, ...prev]);
    }

    setIsModalOpen(false);
    setSelectedApp(null);
    setFormData({
      company: '',
      position: '',
      channel: '',
      status: '已投递',
      applyDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这条投递记录吗？')) {
      setApplications(prev => prev.filter(a => a.id !== id));
      setIsDetailOpen(false);
    }
  };

  const updateStatus = (appId: string, newStatus: ApplicationStatus) => {
    setApplications(prev => prev.map(app => {
      if (app.id === appId) {
        return {
          ...app,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          timeline: [
            {
              id: Math.random().toString(36).substr(2, 9),
              status: newStatus,
              date: new Date().toISOString(),
              note: `状态更新为 ${newStatus}`,
            },
            ...app.timeline
          ]
        };
      }
      return app;
    }));
  };

  return (
    <div className="space-y-8 pb-20">
      <PageHeader 
        title="投递管理台" 
        description="实时追踪您的求职进展，管理每一份面试机会"
        action={
          <button 
            onClick={() => {
              setSelectedApp(null);
              setFormData({
                company: '',
                position: '',
                channel: '',
                status: '已投递',
                applyDate: new Date().toISOString().split('T')[0],
                notes: '',
              });
              setIsModalOpen(true);
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
          >
            <Plus className="w-5 h-5" /> 新增申请
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '总申请数', value: stats.total, color: 'blue' },
          { label: '面试中', value: stats.interviewing, color: 'indigo' },
          { label: '已获 Offer', value: stats.offers, color: 'green' },
          { label: '已结束', value: stats.ended, color: 'gray' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`text-3xl font-black text-${stat.color}-600`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="搜索公司或岗位..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <button 
            onClick={() => setStatusFilter('All')}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              statusFilter === 'All' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-100 hover:border-gray-200'
            }`}
          >
            全部
          </button>
          {(Object.keys(STATUS_CONFIG) as ApplicationStatus[]).map(status => (
            <button 
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                statusFilter === status ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-100 hover:border-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Application List */}
      {filteredApps.length === 0 ? (
        <EmptyState 
          icon={Briefcase}
          title="暂无申请记录"
          description="开启您的求职之旅，记录下第一份投递吧。您可以点击右上角的“新增申请”按钮开始。"
          action={
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
            >
              立即新增
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredApps.map(app => {
            const Config = STATUS_CONFIG[app.status];
            const StatusIcon = Config.icon;
            
            return (
              <motion.div 
                layout
                key={app.id}
                onClick={() => {
                  setSelectedApp(app);
                  setIsDetailOpen(true);
                }}
                className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-full ${Config.bg} ${Config.color} flex items-center gap-1.5`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{app.status}</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{app.channel}</span>
                </div>

                <div className="space-y-1 mb-6">
                  <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors truncate">{app.company}</h3>
                  <p className="text-sm font-bold text-gray-500 truncate">{app.position}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{app.applyDate}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900">{selectedApp ? '编辑申请' : '新增申请'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">公司名称</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="例如：字节跳动"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">岗位名称</label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        value={formData.position}
                        onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                        placeholder="例如：前端开发工程师"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">投递渠道</label>
                    <input 
                      type="text" 
                      value={formData.channel}
                      onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value }))}
                      placeholder="例如：官网、内推、Boss直聘"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">当前状态</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as ApplicationStatus }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-white"
                    >
                      {(Object.keys(STATUS_CONFIG) as ApplicationStatus[]).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">投递日期</label>
                    <input 
                      type="date" 
                      value={formData.applyDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, applyDate: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">面试日期 (可选)</label>
                    <input 
                      type="date" 
                      value={formData.interviewDate || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, interviewDate: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">备注</label>
                  <textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="记录一些关键信息，如薪资范围、联系人等..."
                    className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="p-8 bg-gray-50 flex justify-end gap-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 font-bold text-gray-500 hover:text-gray-900 transition-all"
                >
                  取消
                </button>
                <button 
                  onClick={handleSave}
                  className="bg-blue-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  保存记录
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Drawer */}
      <AnimatePresence>
        {isDetailOpen && selectedApp && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">{selectedApp.company}</h2>
                    <p className="text-sm font-bold text-gray-500">{selectedApp.position}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setFormData(selectedApp);
                      setIsDetailOpen(false);
                      setIsModalOpen(true);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-blue-600"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedApp.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
                {/* Status Update Quick Actions */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">快速更新状态</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(STATUS_CONFIG) as ApplicationStatus[]).map(status => (
                      <button 
                        key={status}
                        onClick={() => updateStatus(selectedApp.id, status)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                          selectedApp.status === status 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' 
                            : 'bg-white text-gray-500 border-gray-100 hover:border-blue-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">投递渠道</p>
                    <p className="text-sm font-bold text-gray-900">{selectedApp.channel || '未填写'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">投递日期</p>
                    <p className="text-sm font-bold text-gray-900">{selectedApp.applyDate}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">面试日期</p>
                    <p className="text-sm font-bold text-gray-900">{selectedApp.interviewDate || '暂无安排'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">最后更新</p>
                    <p className="text-sm font-bold text-gray-900">{new Date(selectedApp.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">备注信息</h3>
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {selectedApp.notes || '暂无备注信息'}
                    </p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <History className="w-4 h-4" /> 状态时间线
                  </h3>
                  <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                    {selectedApp.timeline.map((entry, i) => (
                      <div key={entry.id} className="relative pl-10">
                        <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
                          i === 0 ? 'bg-blue-600' : 'bg-gray-200'
                        }`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-bold ${i === 0 ? 'text-blue-600' : 'text-gray-900'}`}>{entry.status}</span>
                            <span className="text-[10px] text-gray-400 font-medium">{new Date(entry.date).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-gray-500">{entry.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tracker;
