'use client'

import { File, CheckCircle2, Clock, AlertCircle, FileText, Star } from 'lucide-react'

interface FileTreeProps {
  files: any[]
  selectedFile: any
  onSelectFile: (file: any) => void
}

export function FileTree({ files, selectedFile, onSelectFile }: FileTreeProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-neo-muted border-4 border-black shadow-brutal-sm flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-black stroke-[3px]" />
        </div>
        <p className="text-sm text-black font-black uppercase">暂无文件</p>
        <p className="text-xs text-black font-bold mt-2">上传文件开始处理</p>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-6 h-6 bg-neo-secondary border-2 border-black flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-black stroke-[3px]" />
          </div>
        )
      case 'processing':
        return (
          <div className="w-6 h-6 bg-neo-accent border-2 border-black flex items-center justify-center">
            <Clock className="w-4 h-4 text-black animate-spin stroke-[3px]" />
          </div>
        )
      case 'error':
        return (
          <div className="w-6 h-6 bg-neo-accent border-2 border-black flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-black stroke-[3px]" />
          </div>
        )
      default:
        return (
          <div className="w-6 h-6 bg-white border-2 border-black flex items-center justify-center">
            <File className="w-4 h-4 text-black stroke-[3px]" />
          </div>
        )
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs font-black bg-neo-secondary border-2 border-black text-black uppercase tracking-widest">
            完成
          </span>
        )
      case 'processing':
        return (
          <span className="px-2 py-1 text-xs font-black bg-neo-accent border-2 border-black text-black uppercase tracking-widest">
            处理中
          </span>
        )
      case 'error':
        return (
          <span className="px-2 py-1 text-xs font-black bg-neo-accent border-2 border-black text-black uppercase tracking-widest">
            错误
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 text-xs font-black bg-white border-2 border-black text-black uppercase tracking-widest">
            待处理
          </span>
        )
    }
  }

  return (
    <div className="space-y-3">
      {files.map((file, index) => (
        <button
          key={index}
          onClick={() => onSelectFile(file)}
          className={`group w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-100 ${
            selectedFile === file
              ? 'bg-neo-secondary border-4 border-black shadow-brutal-md'
              : 'bg-white border-2 border-black hover:bg-neo-muted hover:border-4 hover:shadow-brutal'
          }`}
        >
          <div className="flex-shrink-0">
            {getStatusIcon(file.status || 'pending')}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center justify-between mb-1">
              <span className="font-black truncate text-black uppercase text-xs">
                {file.name}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-black font-bold truncate">
                {file.path || file.name}
              </span>
              {getStatusBadge(file.status || 'pending')}
            </div>
          </div>
          {selectedFile === file && (
            <Star className="w-4 h-4 text-black fill-black flex-shrink-0" />
          )}
        </button>
      ))}
    </div>
  )
}
