import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Bell, 
  Layout, 
  SortAsc, 
  LogOut, 
  Camera,
  CheckCircle2,
  Globe,
  Moon,
  Smartphone
} from 'lucide-react';
import { motion } from 'motion/react';
import PageHeader from '../components/ui/PageHeader';
import { storage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/storageKeys';
import { UserSettings } from '../types';

const INITIAL_SETTINGS: UserSettings = {
  userName: '求职者用户',
  email: 'zhouyang021011@gmail.com',
  theme: 'light',
};

const Settings = () => {
  const [settings, setSettings] = useState<UserSettings>(INITIAL_SETTINGS);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile');
  const [isSaved, setIsSaved] = useState(false);

  // Load settings
  useEffect(() => {
    const saved = storage.getData<UserSettings>(STORAGE_KEYS.USER_SETTINGS);
    if (saved) {
      setSettings(saved);
    }
  }, []);

  const handleSave = () => {
    storage.setData(STORAGE_KEYS.USER_SETTINGS, settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const tabs = [
    { id: 'profile', label: '账户信息', icon: User },
    { id: 'preferences', label: '偏好设置', icon: Layout },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader 
        title="个人中心" 
        description="管理您的个人资料、账户安全及应用偏好设置。"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                    : 'text-gray-500 hover:bg-white hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
          <div className="pt-6 mt-6 border-t border-gray-100">
            <button className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all">
              <LogOut className="w-5 h-5" />
              退出登录
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden"
          >
            {activeTab === 'profile' ? (
              <div className="p-10 space-y-10">
                {/* Profile Header */}
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative group">
                    <div className="w-32 h-32 bg-gray-100 rounded-[2.5rem] flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                      <User className="w-16 h-16 text-gray-300" />
                    </div>
                    <button className="absolute bottom-0 right-0 p-2.5 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all group-hover:scale-110">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-center md:text-left space-y-2">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <h3 className="text-2xl font-black text-gray-900">{settings.userName}</h3>
                      <div className="px-2 py-0.5 bg-green-100 text-green-600 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase">已登录</span>
                      </div>
                    </div>
                    <p className="text-gray-500 font-medium">{settings.email}</p>
                    <p className="text-xs text-gray-400">账号 ID: CF_772938441</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">用户昵称</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        value={settings.userName}
                        onChange={(e) => setSettings(prev => ({ ...prev, userName: e.target.value }))}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">电子邮箱</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="email" 
                        value={settings.email}
                        onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex items-center justify-between border-t border-gray-50">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    <span>您的个人信息已加密存储在本地</span>
                  </div>
                  <button 
                    onClick={handleSave}
                    className="bg-blue-600 text-white px-10 py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
                  >
                    {isSaved ? <><CheckCircle2 className="w-4 h-4" /> 已保存</> : '保存修改'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-10 space-y-10">
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-gray-900">应用偏好</h3>
                  
                  <div className="space-y-4">
                    {/* Default Home Placeholder */}
                    <div className="flex items-center justify-between p-5 rounded-2xl border border-gray-50 bg-gray-50/30">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Globe className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">默认启动页</p>
                          <p className="text-xs text-gray-400">设置打开应用时显示的第一个页面</p>
                        </div>
                      </div>
                      <select className="bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-xs font-bold outline-none">
                        <option>首页 (Home)</option>
                        <option>工作台 (Workspace)</option>
                        <option>投递管理 (Tracker)</option>
                      </select>
                    </div>

                    {/* Sorting Placeholder */}
                    <div className="flex items-center justify-between p-5 rounded-2xl border border-gray-50 bg-gray-50/30">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <SortAsc className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">列表排序方式</p>
                          <p className="text-xs text-gray-400">简历与投递列表的默认排序逻辑</p>
                        </div>
                      </div>
                      <select className="bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-xs font-bold outline-none">
                        <option>按更新时间</option>
                        <option>按创建时间</option>
                        <option>按名称 A-Z</option>
                      </select>
                    </div>

                    {/* Notification Placeholder */}
                    <div className="flex items-center justify-between p-5 rounded-2xl border border-gray-50 bg-gray-50/30">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Bell className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">面试提醒</p>
                          <p className="text-xs text-gray-400">在面试开始前发送系统通知</p>
                        </div>
                      </div>
                      <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </div>

                    {/* Theme Placeholder */}
                    <div className="flex items-center justify-between p-5 rounded-2xl border border-gray-50 bg-gray-50/30">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Moon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">深色模式</p>
                          <p className="text-xs text-gray-400">切换应用的视觉主题 (当前仅支持浅色)</p>
                        </div>
                      </div>
                      <div className="w-12 h-6 bg-gray-200 rounded-full relative cursor-not-allowed">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-2xl p-6 flex items-start gap-4">
                  <Smartphone className="w-6 h-6 text-blue-600 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-blue-900">移动端同步</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      CareerFlow 原型版本目前仅支持桌面端体验。移动端 App 正在开发中，敬请期待。
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
