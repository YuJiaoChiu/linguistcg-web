'use client'

import { useCallback, useState, useRef } from 'react'
import { Upload, FolderOpen, FileText, Star, CheckCircle2 } from 'lucide-react'

interface FileUploaderProps {
  onFilesUploaded: (files: any[]) => void
}

export function FileUploader({ onFilesUploaded }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      setIsProcessing(true)

      const items = Array.from(e.dataTransfer.items)
      const files: any[] = []

      // Process dropped files/folders
      items.forEach((item) => {
        if (item.kind === 'file') {
          const file = item.getAsFile()
          if (file && file.name.endsWith('.srt')) {
            files.push({
              name: file.name,
              path: file.name,
              file: file,
              status: 'pending',
            })
          }
        }
      })

      // Simulate processing delay
      setTimeout(() => {
        setIsProcessing(false)
        onFilesUploaded(files)
      }, 500)
    },
    [onFilesUploaded]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFolderSelect = useCallback(() => {
    folderInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || [])
      const files: any[] = selectedFiles
        .filter((file) => file.name.endsWith('.srt'))
        .map((file) => ({
          name: file.name,
          path: file.name,
          file: file,
          status: 'pending',
        }))

      if (files.length > 0) {
        setIsProcessing(true)
        setTimeout(() => {
          setIsProcessing(false)
          onFilesUploaded(files)
        }, 500)
      }
    },
    [onFilesUploaded]
  )

  return (
    <div className="w-full max-w-3xl">
      <div
        className={`bg-white border-4 border-black p-12 text-center transition-all duration-100 ${
          isDragging
            ? 'shadow-brutal-xl bg-neo-secondary scale-[1.02]'
            : 'shadow-brutal-lg'
        } ${isProcessing ? 'pointer-events-none opacity-75' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center space-y-8">
          {/* Icon with thick border */}
          <div className="relative">
            <div
              className={`w-24 h-24 bg-neo-accent border-4 border-black flex items-center justify-center shadow-brutal-md transition-transform duration-100 ${
                isDragging ? 'rotate-6 scale-110' : 'hover:scale-105'
              }`}
            >
              {isProcessing ? (
                <div className="w-10 h-10 border-4 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <Upload className="w-12 h-12 text-black stroke-[3px]" />
              )}
            </div>
            {isDragging && (
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-neo-secondary border-3 border-black rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-5 h-5 text-black stroke-[3px]" />
              </div>
            )}
          </div>

          {/* Text Content */}
          <div className="space-y-3">
            <h3 className="text-4xl font-black text-black uppercase tracking-tight flex items-center justify-center gap-3">
              <Star className="w-8 h-8 text-black fill-black" />
              <span>上传字幕文件</span>
            </h3>
            <p className="text-base text-black font-bold">
              拖拽 <span className="px-2 py-1 bg-neo-secondary border-2 border-black font-black">.srt</span> 文件或文件夹到此处
            </p>
            <p className="text-sm text-black font-bold uppercase tracking-wide">
              支持批量递归处理，自动保持目录结构
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <button
              onClick={handleFileSelect}
              disabled={isProcessing}
              className="btn-brutal-primary flex-1 flex items-center justify-center gap-2 py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-5 h-5 stroke-[3px]" />
              <span>选择文件</span>
            </button>
            <button
              onClick={handleFolderSelect}
              disabled={isProcessing}
              className="btn-brutal-secondary flex-1 flex items-center justify-center gap-2 py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FolderOpen className="w-5 h-5 stroke-[3px]" />
              <span>选择文件夹</span>
            </button>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-lg pt-6 border-t-4 border-black">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-neo-secondary border-3 border-black shadow-brutal-sm flex items-center justify-center">
                <FileText className="w-5 h-5 text-black stroke-[3px]" />
              </div>
              <span className="text-xs text-black font-black uppercase tracking-widest">批量处理</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-neo-muted border-3 border-black shadow-brutal-sm flex items-center justify-center">
                <Star className="w-5 h-5 text-black fill-black stroke-[3px]" />
              </div>
              <span className="text-xs text-black font-black uppercase tracking-widest">智能修正</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-neo-accent border-3 border-black shadow-brutal-sm flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-black stroke-[3px]" />
              </div>
              <span className="text-xs text-black font-black uppercase tracking-widest">实时预览</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".srt"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        accept=".srt"
        multiple
        onChange={handleFileChange}
        className="hidden"
        {...{ webkitdirectory: "" } as React.InputHTMLAttributes<HTMLInputElement>}
      />
    </div>
  )
}
