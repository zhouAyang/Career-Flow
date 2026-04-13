import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-20 flex flex-col items-center justify-center text-center space-y-6 shadow-sm">
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
        <Icon className="w-10 h-10 text-gray-200" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
      </div>
      {action && (
        <div className="pt-2">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
