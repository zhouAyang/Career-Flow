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
  Download,
  AlertTriangle,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { SafeInput } from '../components/ui/SafeInput';
import { storage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/storageKeys';
import { ResumeItem } from '../types';

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set worker source for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const ResumeHub = () => {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [previewResume, setPreviewResume] = useState<ResumeItem | null>(null);
  const [editingResume, setEditingResume] = useState<{ id: string, name: string } | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load resumes from localStorage on mount
  useEffect(() => {
    const savedResumes = storage.getData<ResumeItem[]>(STORAGE_KEYS.RESUMES);
    if (savedResumes) {
      setResumes(savedResumes);
    }
    setIsLoaded(true);
  }, []);

  // Save resumes to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      storage.setData(STORAGE_KEYS.RESUMES, resumes);
    }
  }, [resumes, isLoaded]);

  // Sync editing content when preview changes
  useEffect(() => {
    if (previewResume) {
      setEditingContent(previewResume.textContent || '');
    }
  }, [previewResume]);

  // Helper function to extract text from files
  const extractTextFromFile = async (file: File): Promise<string> => {
    const fileType = file.name.split('.').pop()?.toLowerCase();
    
    try {
      if (fileType === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items
            .map((item: any) => item.str)
            .filter(str => str.trim().length > 0);
          fullText += strings.join(' ') + '\n';
        }
        return fullText.trim() || "PDF 解析完成，但未发现可提取文本（可能是图片型文档）。";
      } else if (fileType === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value.trim() || "DOCX 解析完成，但未发现内容。";
      } else if (fileType === 'doc') {
        return "无法直接解析 .doc 文件。建议将其另存为 .docx 或 .pdf 格式后再上传，或手动在此处粘贴内容。";
      } else {
        return "不支持的文件格式。";
      }
    } catch (err) {
      console.error('Text extraction error:', err);
      return `解析文件出错: ${err instanceof Error ? err.message : '未知错误'}。建议尝试手动粘贴内容。`;
    }
  };

  const handleSaveContent = () => {
    if (previewResume) {
      setResumes(prev => prev.map(r => 
        r.id === previewResume.id ? { ...r, textContent: editingContent } : r
      ));
      setPreviewResume({ ...previewResume, textContent: editingContent });
      alert('内容已保存');
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadStatus('uploading');

    try {
      const newItems: ResumeItem[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
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
          accept=".pdf,.doc,.docx"
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
          <p className="text-gray-500 text-sm">支持 PDF, DOC, DOCX 格式 (最大 10MB)</p>
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
              description="快去上传你的第一份简历吧，支持 PDF, DOC, DOCX 格式。"
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

              <div className="p-0 space-y-0 max-h-[70vh] overflow-y-auto">
                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">文件类型</p>
                      <p className="text-gray-900 font-bold">{previewResume.fileType}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">文件大小</p>
                      <p className="text-gray-900 font-bold">{formatFileSize(previewResume.fileSize)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">上传日期</p>
                      <p className="text-gray-900 font-bold">
                        {new Date(previewResume.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">文档状态</p>
                      <p className={`font-bold ${editingContent && editingContent.length > 50 ? 'text-green-600' : 'text-amber-500'}`}>
                        {editingContent && editingContent.length > 50 ? '解析成功' : '需要检查'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                        <h4 className="font-bold text-gray-900">简历解析内容</h4>
                      </div>
                      <button 
                        onClick={handleSaveContent}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                      >
                        <Save className="w-3 h-3" /> 保存文字更新
                      </button>
                    </div>

                    <div className="relative">
                      <textarea 
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        placeholder="此处显示解析后的简历文字。如果解析失败或为空，请在此手动粘贴简历文本，这是 AI 进行精准分析的关键。"
                        className="w-full h-80 bg-gray-50 border border-gray-200 rounded-[2rem] p-8 text-sm text-gray-600 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all resize-none shadow-inner"
                      />
                      {(!editingContent || editingContent.length < 50) && (
                        <div className="absolute inset-x-0 bottom-8 flex flex-col items-center justify-center pointer-events-none opacity-40">
                           <AlertTriangle className="w-10 h-10 text-amber-500 mb-2" />
                           <p className="text-amber-700 text-xs font-bold">内容不足，请手动粘贴简历文字以确保 AI 分析准确</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      <p className="text-xs text-amber-800 leading-relaxed">
                        注意：AI 的匹配分析主要依赖于这些文字内容。如果文档是扫描件或解析存在乱码，请务必手动修正。
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button className="flex items-center gap-2 bg-white border border-gray-200 px-6 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">
                  <Download className="w-4 h-4" /> 导出文件
                </button>
                <button 
                  onClick={() => setPreviewResume(null)}
                  className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95"
                >
                  确定并返回
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
