import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, FileText, PenTool, ClipboardList, User, Briefcase } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { name: '首页', path: '/', icon: Layout },
    { name: '上传简历', path: '/resume', icon: FileText },
    { name: '求职内容工作台', path: '/workspace', icon: PenTool },
    { name: '投递管理台', path: '/tracker', icon: ClipboardList },
    { name: '个人中心', path: '/settings', icon: User },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <span className="font-black text-2xl tracking-tighter text-gray-900">CareerFlow<span className="text-blue-600">.</span></span>
        </Link>
        
        <div className="hidden md:flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Link 
            to="/settings"
            className={`p-2.5 rounded-xl transition-all ${
              location.pathname === '/settings' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
            }`}
          >
            <User className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
