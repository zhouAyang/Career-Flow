import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Eye, 
  Edit3, 
  X, 
  CheckCircle2, 
  AlertCircle,
  FileIcon,
  MoreVertical,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { SafeInput } from '../components/ui/SafeInput';
import { storage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/storageKeys';
import { ResumeItem } from '../types';

const SUPPORTED_EXTENSIONS = ['doc', 'docx', 'pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ResumeHub = () => {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [previewResume, setPreviewResume] = useState<ResumeItem | null>(null);
  const [editingResume, setEditingResume] = useState<{ id: string, name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load resumes from localStorage on mount
  useEffect(() => {
    const savedResumes = storage.getData<ResumeItem[]>(STORAGE_KEYS.RESUMES);
    if (savedResumes) {
      setResumes(savedResumes);
    }
  }, []);

  // Save resumes to localStorage whenever they change
  useEffect(() => {
    storage.setData(STORAGE_KEYS.RESUMES, resumes);
  }, [resumes]);

  // Helper function to extract text from files via backend API
  const extractTextFromFile = async (file: File): Promise<string> => {
    const fileType = file.name.split('.').pop()?.toLowerCase();

    // 验证文件类型
    if (!fileType || !SUPPORTED_EXTENSIONS.includes(fileType)) {
      throw new Error(`不支持的文件格式。仅支持 ${SUPPORTED_EXTENSIONS.map(ext => ext.toUpperCase()).join('、')} 文件。`);
    }

    try {
      // 调用后端 API 解析文件
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `解析失败 (${response.status})`);
      }

      const data = await response.json();
      return data.text || '解析结果为空';

    } catch (err) {
      console.error('Text extraction error:', err);
      throw err;
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadStatus('uploading');

    try {
      const newItems: ResumeItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop()?.toLowerCase();

        if (!fileExt || !SUPPORTED_EXTENSIONS.includes(fileExt)) {
          alert(`文件 "${file.name}" 格式不支持。仅支持 DOC、DOCX、PDF 格式。`);
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          alert(`文件 "${file.name}" 大小超过限制。最大支持 10MB。`);
          continue;
        }

        const extractedText = await extractTextFromFile(file);
        
        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          fileType: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
          fileSize: file.size,
          uploadDate: new Date().toISOString(),
          textContent: extractedText
        });
      }

      setResumes(prev => [...newItems, ...prev]);
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (error) {
      console.error('File upload/parse error:', error);
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这份简历吗？')) {
      setResumes(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleRename = () => {
    if (editingResume) {
      setResumes(prev => prev.map(r => 
        r.id === editingResume.id ? { ...r, name: editingResume.name } : r
      ));
      setEditingResume(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader 
        title="上传简历" 
        description="用于统一管理不同版本的简历资产，支持多版本托管与快速预览。"
      />

      <div className="space-y-12">
        {/* Upload Area */}
        <section 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFileUpload(e.dataTransfer.files);
          }}
          className={`relative border-2 border-dashed rounded-[2.5rem] p-12 transition-all duration-300 flex flex-col items-center justify-center text-center space-y-4 ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          multiple
          accept=".doc,.docx,.pdf"
          onChange={(e) => handleFileUpload(e.target.files)}
        />
        
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-2 ${
          uploadStatus === 'success' ? 'bg-green-100 text-green-600' : 
          uploadStatus === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'
        }`}>
          {uploadStatus === 'uploading' ? (
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          ) : uploadStatus === 'success' ? (
            <CheckCircle2 className="w-10 h-10" />
          ) : uploadStatus === 'error' ? (
            <AlertCircle className="w-10 h-10" />
          ) : (
            <Upload className="w-10 h-10" />
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold text-gray-900">
            {uploadStatus === 'success' ? '上传成功！' : '点击或拖拽简历至此'}
          </h3>
          <p className="text-gray-500 text-sm">支持 DOC, DOCX, PDF 格式 (最大 10MB)</p>
        </div>

        <button 
          onClick={() => fileInputRef.current?.click()}
          className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95"
        >
          选择文件
        </button>

        {uploadStatus === 'success' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 text-green-600 font-medium flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> 简历已添加到列表
          </motion.div>
        )}
      </section>

        {/* Resume List */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              已上传简历 <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">{resumes.length}</span>
            </h2>
          </div>

          {resumes.length === 0 ? (
            <EmptyState 
              icon={FileText}
              title="暂无简历"
              description="快去上传你的第一份简历吧，支持 DOC, DOCX, PDF 格式。"
              action={
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
                >
                  立即上传
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
            {resumes.map((resume) => (
              <motion.div
                layout
                key={resume.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between group hover:shadow-md hover:border-blue-100 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <FileIcon className="w-6 h-6" />
                  </div>
                  <div>
                    {editingResume?.id === resume.id ? (
                      <div className="flex items-center gap-2">
                        <SafeInput 
                          autoFocus
                          type="text" 
                          value={editingResume.name}
                          onValueChange={(val) => setEditingResume({ ...editingResume, name: val })}
                          onBlur={handleRename}
                          onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                          className="text-sm font-bold text-gray-900 border-b-2 border-blue-500 outline-none py-0.5 bg-transparent"
                        />
                      </div>
                    ) : (
                      <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{resume.name}</h4>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-medium text-gray-400 uppercase">{resume.fileType}</span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs font-medium text-gray-400">{formatFileSize(resume.fileSize)}</span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs font-medium text-gray-400">
                        {new Date(resume.uploadDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setPreviewResume(resume)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="预览"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setEditingResume({ id: resume.id, name: resume.name })}
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                    title="重命名"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(resume.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="删除"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewResume && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewResume(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <FileIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{previewResume.name}</h3>
                    <p className="text-sm text-gray-500">简历详情预览</p>
                  </div>
                </div>
                <button 
                  onClick={() => setPreviewResume(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">文件类型</p>
                    <p className="text-gray-900 font-semibold">{previewResume.fileType}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">文件大小</p>
                    <p className="text-gray-900 font-semibold">{formatFileSize(previewResume.fileSize)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">上传时间</p>
                    <p className="text-gray-900 font-semibold">
                      {new Date(previewResume.uploadDate).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">简历 ID</p>
                    <p className="text-gray-900 font-mono text-sm">{previewResume.id}</p>
                  </div>
                </div>

                {previewResume.textContent ? (
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-gray-900">解析的简历内容</h4>
                      <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        已解析
                      </span>
                    </div>
                    <div className="max-h-96 overflow-y-auto bg-white rounded-lg p-4 border border-gray-200">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                        {previewResume.textContent}
                      </pre>
                    </div>
                    <div className="mt-4 text-xs text-gray-500">
                      共 {previewResume.textContent.length} 个字符
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-4 border border-gray-100">
                    <FileText className="w-12 h-12 text-gray-200" />
                    <p className="text-gray-400 text-sm max-w-xs">
                      该简历未解析或解析内容为空。您可以下载文件进行查看。
                    </p>
                    <button className="flex items-center gap-2 bg-white border border-gray-200 px-6 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">
                      <Download className="w-4 h-4" /> 下载简历
                    </button>
                  </div>
                )}
              </div>

              <div className="p-8 bg-gray-50/50 border-t border-gray-50 flex justify-end">
                <button 
                  onClick={() => setPreviewResume(null)}
                  className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all"
                >
                  关闭预览
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
};

export default ResumeHub;
