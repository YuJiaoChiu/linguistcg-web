'use client'

import { useState, useEffect, useRef } from 'react'
import { FileUploader } from '@/components/features/FileUploader'
import { DiffViewer } from '@/components/features/DiffViewer'
import { FileTree } from '@/components/features/FileTree'
import { StatsPanel } from '@/components/features/StatsPanel'
import { Settings, Zap, Star, CheckCircle2, Loader2, Download, FileText, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { API_BASE } from '@/lib/config'

// 处理阶段文案
const PROCESSING_STAGES = [
  '正在读取字幕文件...',
  '正在分析文本内容...',
  '正在应用修正规则...',
  '正在匹配术语字典...',
  '正在清理噪音标记...',
  '正在生成差异对比...',
  '正在保存处理结果...',
]

export default function HomePage() {
  const [files, setFiles] = useState<any[]>([])
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState<any>(null)
  const [simulatedProgress, setSimulatedProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 模拟进度动画
  useEffect(() => {
    if (isProcessing) {
      setSimulatedProgress(0)
      setProcessingStage(0)

      progressIntervalRef.current = setInterval(() => {
        setSimulatedProgress(prev => {
          // 模拟进度：快速到80%，然后变慢
          if (prev < 30) return prev + Math.random() * 8
          if (prev < 60) return prev + Math.random() * 5
          if (prev < 80) return prev + Math.random() * 2
          if (prev < 95) return prev + Math.random() * 0.5
          return prev
        })

        setProcessingStage(prev => {
          if (prev < PROCESSING_STAGES.length - 1) {
            return prev + (Math.random() > 0.7 ? 1 : 0)
          }
          return prev
        })
      }, 300)
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      // 完成时直接跳到100%
      if (processingStatus?.status === 'completed') {
        setSimulatedProgress(100)
        setProcessingStage(PROCESSING_STAGES.length - 1)
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [isProcessing, processingStatus?.status])

  // 处理文件上传
  const handleFilesUploaded = async (uploadedFiles: any[]) => {
    try {
      // 创建 FormData 上传文件
      const formData = new FormData()
      uploadedFiles.forEach(fileData => {
        formData.append('files', fileData.file)
      })

      // 上传文件到服务器
      const uploadRes = await fetch(`${API_BASE}/files/upload`, {
        method: 'POST',
        body: formData
      })

      if (!uploadRes.ok) {
        throw new Error('文件上传失败')
      }

      const uploadData = await uploadRes.json()

      // 更新文件列表，添加 file_id
      const filesWithIds = uploadedFiles.map((file, idx) => ({
        ...file,
        file_id: uploadData.files[idx].file_id,
        status: 'uploaded'
      }))

      setFiles(filesWithIds)
    } catch (error) {
      console.error('上传失败:', error)
      alert('文件上传失败: ' + (error as Error).message)
    }
  }

  // 批量处理
  const handleBatchProcess = async () => {
    if (files.length === 0) {
      alert('请先上传文件')
      return
    }

    try {
      setIsProcessing(true)

      // 调用处理 API（发送文件ID和原始文件名）
      const fileInfos = files.map(f => ({
        file_id: f.file_id,
        filename: f.name || f.filename || `${f.file_id}.srt`
      }))
      const res = await fetch(`${API_BASE}/processing/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: fileInfos,
          use_correction: true,
          use_shielding: true,
          use_noise_removal: true
        })
      })

      if (!res.ok) {
        throw new Error('启动处理失败')
      }

      const data = await res.json()
      setTaskId(data.task_id)

      // 开始轮询状态
      pollProcessingStatus(data.task_id)

    } catch (error) {
      console.error('处理失败:', error)
      alert('批量处理失败: ' + (error as Error).message)
      setIsProcessing(false)
    }
  }

  // 轮询处理状态
  const pollProcessingStatus = async (tid: string) => {
    try {
      const res = await fetch(`${API_BASE}/processing/status/${tid}`)
      if (!res.ok) return

      const status = await res.json()
      setProcessingStatus(status)

      if (status.status === 'completed') {
        // 处理完成，获取结果
        const resultRes = await fetch(`${API_BASE}/processing/result/${tid}`)
        if (resultRes.ok) {
          const result = await resultRes.json()

          // 更新文件列表，添加处理结果
          const updatedFiles = files.map(file => {
            const processedFile = result.files.find((f: any) => f.file_id === file.file_id)
            if (processedFile) {
              return {
                ...file,
                status: 'completed',
                statistics: processedFile.statistics,
                diff_data: processedFile.diff_data,
                output_path: processedFile.output_path
              }
            }
            return file
          })

          setFiles(updatedFiles)
          // 确保统计数据正确设置
          setProcessingStatus({
            ...status,
            statistics: {
              total_replacements: result.statistics?.total_replacements || 0,
              term_corrections: result.statistics?.term_corrections || 0,
              noise_removals: result.statistics?.noise_removals || 0,
              top_replacements: result.statistics?.top_replacements || []
            }
          })
          console.log('Processing stats:', result.statistics)
        }
        setIsProcessing(false)
      } else if (status.status === 'failed') {
        setIsProcessing(false)
        alert('处理失败')
      } else {
        // 继续轮询
        setTimeout(() => pollProcessingStatus(tid), 1000)
      }
    } catch (error) {
      console.error('轮询状态失败:', error)
      setIsProcessing(false)
    }
  }

  // 计算显示的进度（取实际进度和模拟进度的较大值）
  const displayProgress = Math.max(
    processingStatus?.progress || 0,
    Math.round(simulatedProgress)
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* 处理中遮罩层 */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white border-4 border-black shadow-brutal-lg p-8 max-w-md w-full mx-4">
            {/* 动画图标 */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 bg-neo-accent border-4 border-black shadow-brutal flex items-center justify-center">
                  <FileText className="w-12 h-12 text-black stroke-[2px] animate-pulse" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="w-8 h-8 text-neo-secondary animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div className="absolute -bottom-2 -left-2">
                  <div className="w-6 h-6 bg-neo-secondary border-2 border-black rounded-full animate-bounce" />
                </div>
              </div>
            </div>

            {/* 标题 */}
            <h2 className="text-2xl font-black text-black text-center uppercase tracking-tight mb-2">
              正在处理
            </h2>
            <p className="text-sm text-gray-600 text-center font-bold mb-6">
              共 {files.length} 个文件
            </p>

            {/* 进度条 */}
            <div className="mb-4">
              <div className="flex justify-between text-sm font-black text-black mb-2">
                <span>进度</span>
                <span>{displayProgress}%</span>
              </div>
              <div className="h-6 bg-neo-muted border-4 border-black overflow-hidden">
                <div
                  className="h-full bg-neo-accent transition-all duration-300 ease-out relative"
                  style={{ width: `${displayProgress}%` }}
                >
                  {/* 进度条动画条纹 */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)',
                      animation: 'moveStripes 1s linear infinite',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 当前阶段 */}
            <div className="bg-neo-cream border-2 border-black p-3 mb-4">
              <p className="text-sm text-black font-bold text-center flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {PROCESSING_STAGES[processingStage]}
              </p>
            </div>

            {/* 文件处理进度 */}
            {processingStatus?.processed_files !== undefined && (
              <p className="text-xs text-gray-500 text-center font-bold">
                已处理 {processingStatus.processed_files} / {processingStatus.total_files || files.length} 个文件
              </p>
            )}
          </div>
        </div>
      )}

      {/* 进度条动画样式 */}
      <style jsx>{`
        @keyframes moveStripes {
          0% { background-position: 0 0; }
          100% { background-position: 40px 0; }
        }
      `}</style>

      {/* Navigation Bar - Neo-Brutal Style */}
      <nav className="border-b-4 border-black bg-white z-50">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo with thick border */}
              <div className="relative">
                <div className="w-12 h-12 bg-neo-accent border-4 border-black shadow-brutal flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-black stroke-[3px]" />
                </div>
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-neo-secondary border-2 border-black rounded-full animate-bounce-slow"></div>
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-black uppercase">
                  LinguistCG
                </h1>
                <p className="text-xs font-bold text-black uppercase tracking-widest">
                  Professional Subtitle Tool
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/dictionary"
                className="px-5 py-3 bg-white border-4 border-black text-black font-bold uppercase tracking-wide shadow-brutal hover:bg-neo-muted hover:shadow-brutal-md active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 flex items-center gap-2"
              >
                <Settings className="w-5 h-5 stroke-[3px]" />
                <span>字典</span>
              </Link>
              <button
                onClick={handleBatchProcess}
                disabled={files.length === 0 || isProcessing}
                className="px-6 py-3 bg-neo-accent border-4 border-black text-black font-bold uppercase tracking-wide shadow-brutal hover:shadow-brutal-md active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin stroke-[3px]" />
                    <span>处理中 {processingStatus?.progress || 0}%</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 stroke-[3px]" />
                    <span>批量处理</span>
                  </>
                )}
              </button>
              {/* 下载全部 ZIP 按钮 - 处理完成后显示 */}
              {taskId && processingStatus?.status === 'completed' && (
                <a
                  href={`${API_BASE}/processing/download-zip/${taskId}`}
                  className="px-6 py-3 bg-neo-secondary border-4 border-black text-black font-bold uppercase tracking-wide shadow-brutal hover:shadow-brutal-md active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 flex items-center gap-2"
                >
                  <Download className="w-5 h-5 stroke-[3px]" />
                  <span>下载全部 ZIP</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - File Tree */}
        <aside className="w-80 overflow-y-auto scrollbar-brutal border-r-4 border-black bg-white">
          <div className="p-6">
            {/* Section Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-neo-secondary border-3 border-black shadow-brutal-sm flex items-center justify-center">
                    <div className="w-3 h-3 bg-black"></div>
                  </div>
                  <h2 className="text-lg font-black text-black uppercase tracking-tight">
                    文件列表
                  </h2>
                </div>
                {files.length > 0 && (
                  <span className="px-3 py-1 bg-neo-accent border-2 border-black text-black font-black text-xs uppercase tracking-widest shadow-brutal-sm">
                    {files.length}
                  </span>
                )}
              </div>
              <div className="h-1 bg-black"></div>
            </div>

            <FileTree
              files={files}
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
            />
          </div>
        </aside>

        {/* Center - Main Editor */}
        <main className="flex-1 p-8 overflow-auto scrollbar-brutal bg-neo-cream relative">
          {/* Decorative background pattern */}
          <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>

          <div className="max-w-7xl mx-auto h-full relative z-10">
            {!selectedFile ? (
              <div className="h-full flex items-center justify-center">
                <div className="relative">
                  {/* Decorative stars */}
                  <div className="absolute -top-12 -left-12 rotate-12">
                    <Star className="w-10 h-10 text-neo-accent fill-neo-accent stroke-[3px]" />
                  </div>
                  <div className="absolute -bottom-12 -right-12 -rotate-12 animate-spin-slow">
                    <Star className="w-8 h-8 text-neo-secondary fill-neo-secondary stroke-[3px]" />
                  </div>

                  <FileUploader onFilesUploaded={handleFilesUploaded} />
                </div>
              </div>
            ) : (
              <div className="h-full">
                <DiffViewer file={selectedFile} />
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar - Stats */}
        <aside className="w-96 overflow-y-auto scrollbar-brutal border-l-4 border-black bg-white">
          <div className="p-6">
            {/* Section Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-neo-muted border-3 border-black shadow-brutal-sm flex items-center justify-center">
                  <div className="flex gap-1">
                    <div className="w-1 h-4 bg-black"></div>
                    <div className="w-1 h-6 bg-black"></div>
                    <div className="w-1 h-3 bg-black"></div>
                  </div>
                </div>
                <h2 className="text-lg font-black text-black uppercase tracking-tight">
                  统计信息
                </h2>
              </div>
              <div className="h-1 bg-black"></div>
            </div>

            <StatsPanel processingStats={processingStatus?.statistics} />

            {/* Additional Info Card */}
            <div className="mt-6 bg-neo-secondary border-4 border-black p-6 shadow-brutal-md sticker-rotate-n1">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-black stroke-[3px]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-black text-black mb-2 uppercase tracking-tight">
                    智能修正
                  </h3>
                  <p className="text-xs text-black font-bold leading-relaxed">
                    基于字典的智能字幕修正，支持批量处理和差异对比
                  </p>
                </div>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="mt-6 space-y-3">
              {['实时差异预览', '批量文件处理', '自定义字典管理'].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white border-2 border-black shadow-brutal-sm">
                  <div className="w-6 h-6 bg-neo-accent border-2 border-black flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-black stroke-[3px]" />
                  </div>
                  <span className="text-sm font-bold text-black uppercase tracking-wide">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
