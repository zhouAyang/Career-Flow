import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, PenTool, ClipboardList, ArrowRight, Sparkles, Target, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';

const Home = () => {
  const mainActions = [
    {
      title: '上传简历',
      path: '/resume',
      icon: FileText,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: '进入求职内容工作台',
      path: '/workspace',
      icon: PenTool,
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      title: '进入投递管理台',
      path: '/tracker',
      icon: ClipboardList,
      color: 'bg-emerald-600 hover:bg-emerald-700',
    }
  ];

  const featureDetails = [
    {
      title: '上传简历',
      description: '简历资产管理',
      details: '用于统一管理不同版本的简历资产。支持多版本托管，方便针对不同行业或岗位快速调用最合适的简历版本。',
      icon: Target,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: '求职内容工作台',
      description: 'AI 驱动内容优化',
      details: '核心 AI 模块。支持选择已有简历并输入目标职位描述（JD），完成匹配度分析、简历内容润色，并自动生成针对性的面试预测问题。',
      icon: Sparkles,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      title: '投递管理台',
      description: '全流程进度追踪',
      details: '求职进度看板。用于记录每一份申请的投递进展、面试安排、沟通记录及最终结果，通过可视化方式掌控求职漏斗。',
      icon: BarChart3,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-20 py-10">
      {/* Hero Section */}
      <section className="text-center space-y-10 py-10">
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black tracking-widest uppercase"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Next-Gen Career Management
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 leading-[1.1]"
          >
            智能求职管理<br />
            <span className="text-blue-600">掌控面试全流程</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            CareerFlow AI 助您高效管理简历资产，利用 AI 深度分析岗位匹配度，并实时追踪投递进展，让每一份努力都清晰可见。
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4 pt-4"
        >
          <Link
            to="/resume"
            className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-gray-200 transition-all hover:bg-gray-800 hover:-translate-y-1 active:scale-95"
          >
            <FileText className="w-5 h-5" />
            开始上传简历
          </Link>
          <Link
            to="/workspace"
            className="bg-white text-gray-900 border border-gray-100 px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-sm transition-all hover:bg-gray-50 hover:-translate-y-1 active:scale-95"
          >
            <PenTool className="w-5 h-5 text-blue-600" />
            进入 AI 工作台
          </Link>
        </motion.div>
      </section>

      {/* Feature Details Grid */}
      <section className="space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">核心功能模块</h2>
          <p className="text-gray-500">专为求职全生命周期设计的专业工具集</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featureDetails.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-100 transition-all duration-300 group"
            >
              <div className={`w-16 h-16 ${feature.bgColor} ${feature.iconColor} rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                <feature.icon className="w-8 h-8" />
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-black text-gray-900">{feature.title}</h3>
                  <p className={`text-xs font-black uppercase tracking-widest ${feature.iconColor} mt-2`}>{feature.description}</p>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed font-medium">
                  {feature.details}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer Note for Interview */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="pt-10 border-t border-gray-100 text-center"
      >
        <div className="inline-flex items-center gap-2 text-gray-400 text-sm font-medium">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          项目原型展示版 · 适合前端技术面试与产品演示
        </div>
      </motion.section>
    </div>
  );
};

export default Home;
