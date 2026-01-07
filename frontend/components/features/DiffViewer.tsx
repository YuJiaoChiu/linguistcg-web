'use client'

import { FileText, Download, Copy, CheckCircle2, AlertCircle } from 'lucide-react'
import { useState, useMemo } from 'react'
import { diffChars } from 'diff'

interface DiffEntry {
  index: number
  time: string
  original: string
  modified: string
  changed: boolean
}

interface DiffViewerProps {
  file: any
}

// 计算两个字符串的差异并返回高亮的 JSX（字符级别对比，适合中文）
function renderDiff(original: string, modified: string) {
  const changes = diffChars(original, modified)

  // 合并连续的相同类型变更，使显示更紧凑
  const mergedChanges: Array<{ type: 'added' | 'removed' | 'unchanged'; value: string }> = []

  for (const part of changes) {
    const type = part.added ? 'added' : part.removed ? 'removed' : 'unchanged'
    const last = mergedChanges[mergedChanges.length - 1]

    if (last && last.type === type) {
      last.value += part.value
    } else {
      mergedChanges.push({ type, value: part.value })
    }
  }

  return (
    <span>
      {mergedChanges.map((part, index) => {
        if (part.type === 'added') {
          return (
            <span
              key={index}
              className="bg-green-300 text-green-900 font-black border-b-2 border-green-600 mx-0.5"
            >
              {part.value}
            </span>
          )
        }
        if (part.type === 'removed') {
          return (
            <span
              key={index}
              className="bg-red-200 text-red-700 line-through mx-0.5"
            >
              {part.value}
            </span>
          )
        }
        return <span key={index}>{part.value}</span>
      })}
    </span>
  )
}

export function DiffViewer({ file }: DiffViewerProps) {
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'inline' | 'side'>('inline')

  // 使用实际的 diff_data
  const diffData: DiffEntry[] = file.diff_data || []

  const handleCopy = () => {
    const modifiedText = diffData
      .map(d => `${d.index}\n${d.time}\n${d.modified}`)
      .join('\n\n')
    navigator.clipboard.writeText(modifiedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const content = diffData
      .map(d => `${d.index}\n${d.time}\n${d.modified}\n`)
      .join('\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name || 'subtitle.srt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const changedCount = diffData.filter(d => d.changed).length

  if (diffData.length === 0) {
    return (
      <div className="bg-white border-4 border-black p-6 h-full flex items-center justify-center shadow-brutal-lg">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-bold text-gray-500">请先处理文件以查看差异对比</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border-4 border-black p-6 h-full flex flex-col shadow-brutal-lg">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-neo-accent border-4 border-black shadow-brutal flex items-center justify-center">
              <FileText className="w-6 h-6 text-black stroke-[3px]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-black uppercase tracking-tight">
                {file.name}
              </h2>
              <p className="text-sm text-black font-bold mt-1">
                {changedCount} / {diffData.length} 条字幕被修改
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex border-4 border-black">
            <button
              onClick={() => setViewMode('inline')}
              className={`px-3 py-2 font-bold text-sm uppercase ${
                viewMode === 'inline'
                  ? 'bg-neo-accent text-black'
                  : 'bg-white text-black hover:bg-neo-muted'
              }`}
            >
              Inline
            </button>
            <button
              onClick={() => setViewMode('side')}
              className={`px-3 py-2 font-bold text-sm uppercase border-l-4 border-black ${
                viewMode === 'side'
                  ? 'bg-neo-accent text-black'
                  : 'bg-white text-black hover:bg-neo-muted'
              }`}
            >
              并排
            </button>
          </div>
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-white border-4 border-black text-black font-bold uppercase tracking-wide shadow-brutal hover:bg-neo-muted hover:shadow-brutal-md active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 flex items-center gap-2 text-sm"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black stroke-[3px]" />
                <span>已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 stroke-[3px]" />
                <span>复制</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="btn-brutal-primary flex items-center gap-2 text-sm py-2"
          >
            <Download className="w-4 h-4 stroke-[3px]" />
            <span>下载</span>
          </button>
        </div>
      </div>

      {/* Diff Content */}
      <div className="flex-1 overflow-auto scrollbar-brutal">
        {viewMode === 'inline' ? (
          // Inline View - 直观显示差异
          <div className="space-y-4">
            {diffData.map((entry, index) => (
              <div
                key={index}
                className={`border-4 border-black p-4 ${
                  entry.changed
                    ? 'bg-yellow-50 border-l-8 border-l-neo-accent'
                    : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-black text-white font-black text-sm">
                      #{entry.index}
                    </span>
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                      {entry.time}
                    </span>
                  </div>
                  {entry.changed && (
                    <span className="px-2 py-1 bg-neo-secondary border-2 border-black text-xs font-black uppercase">
                      已修改
                    </span>
                  )}
                </div>

                {entry.changed ? (
                  <div className="text-base leading-relaxed font-medium">
                    {renderDiff(entry.original, entry.modified)}
                  </div>
                ) : (
                  <div className="text-base leading-relaxed font-medium text-gray-600">
                    {entry.original}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Side by Side View
          <div className="grid grid-cols-2 gap-4">
            {/* Original Column Header */}
            <div className="sticky top-0 bg-red-100 border-4 border-black p-3 z-10">
              <h3 className="font-black text-black uppercase flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                原始字幕
              </h3>
            </div>
            <div className="sticky top-0 bg-green-100 border-4 border-black p-3 z-10">
              <h3 className="font-black text-black uppercase flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                修正后字幕
              </h3>
            </div>

            {diffData.map((entry, index) => (
              <>
                <div
                  key={`orig-${index}`}
                  className={`border-2 border-black p-3 ${
                    entry.changed ? 'bg-red-50' : 'bg-white'
                  }`}
                >
                  <div className="text-xs font-bold text-gray-500 mb-2">
                    #{entry.index} | {entry.time}
                  </div>
                  <div className="text-sm font-medium">{entry.original}</div>
                </div>
                <div
                  key={`mod-${index}`}
                  className={`border-2 border-black p-3 ${
                    entry.changed ? 'bg-green-50' : 'bg-white'
                  }`}
                >
                  <div className="text-xs font-bold text-gray-500 mb-2">
                    #{entry.index} | {entry.time}
                  </div>
                  <div className="text-sm font-medium">{entry.modified}</div>
                </div>
              </>
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="mt-6 pt-4 border-t-4 border-black flex items-center justify-between text-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-300 border-2 border-black"></div>
            <span className="text-black font-bold">新增</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-200 border-2 border-black"></div>
            <span className="text-black font-bold line-through">删除</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-black font-bold uppercase">
              修改: <span className="font-black">{changedCount}</span> 条
            </span>
          </div>
        </div>
        <div className="text-xs text-black font-bold uppercase tracking-widest">
          {new Date().toLocaleTimeString('zh-CN')}
        </div>
      </div>
    </div>
  )
}
