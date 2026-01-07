'use client'

import { BarChart3, Shield, TrendingUp, Zap, CheckCircle2, History } from 'lucide-react'
import { useEffect, useState } from 'react'
import { API_BASE } from '@/lib/config'

interface StatsPanelProps {
  processingStats?: {
    total_replacements?: number
    term_corrections?: number
    noise_removals?: number
    top_replacements?: Array<{ source: string; target?: string; count: number }>
  }
}

export function StatsPanel({ processingStats }: StatsPanelProps) {
  const [dictionaryStats, setDictionaryStats] = useState({
    correctionRules: 0,
    protectedWords: 0,
    noisePatterns: 0,
  })

  const [historicalStats, setHistoricalStats] = useState<{
    total_files_processed: number
    total_replacements: number
    top_terms: Array<{ source: string; count: number }>
  }>({
    total_files_processed: 0,
    total_replacements: 0,
    top_terms: []
  })

  // 从 API 加载字典统计
  useEffect(() => {
    const fetchDictionaryStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/dictionaries/stats`)
        if (res.ok) {
          const data = await res.json()
          setDictionaryStats({
            correctionRules: data.correction_terms || 0,
            protectedWords: data.protected_words || 0,
            noisePatterns: data.noise_patterns || 0,
          })
        }
      } catch (error) {
        console.error('获取字典统计失败:', error)
      }
    }
    fetchDictionaryStats()
  }, [])

  // 加载历史累计统计
  useEffect(() => {
    const fetchHistoricalStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/dictionaries/historical-stats`)
        if (res.ok) {
          const data = await res.json()
          setHistoricalStats({
            total_files_processed: data.total_files_processed || 0,
            total_replacements: data.total_replacements || 0,
            top_terms: data.top_terms || []
          })
        }
      } catch (error) {
        console.error('获取历史统计失败:', error)
      }
    }
    fetchHistoricalStats()

    // 每次处理完成后刷新
    if (processingStats?.total_replacements) {
      fetchHistoricalStats()
    }
  }, [processingStats])

  // 本次处理统计
  const currentStats = {
    totalReplacements: processingStats?.total_replacements || 0,
    termCorrections: processingStats?.term_corrections || 0,
    noiseRemovals: processingStats?.noise_removals || 0,
  }

  return (
    <div className="space-y-6">
      {/* 本次处理统计 */}
      <div>
        <h3 className="text-sm font-black text-black mb-4 flex items-center gap-2 uppercase">
          <BarChart3 className="w-5 h-5 text-black stroke-[3px]" />
          <span>本次处理</span>
        </h3>
        <div className="bg-white border-4 border-black p-5 shadow-brutal-md space-y-4">
          <div className="flex justify-between items-center pb-3 border-b-2 border-black">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-neo-accent border-2 border-black"></div>
              <span className="text-sm text-black font-bold uppercase">
                替换次数
              </span>
            </div>
            <span className="text-3xl font-black text-black">
              {currentStats.totalReplacements}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-black stroke-[3px]" />
              <span className="text-sm text-black font-bold uppercase">
                术语修正
              </span>
            </div>
            <span className="text-xl font-black text-black">
              {currentStats.termCorrections}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-black stroke-[3px]" />
              <span className="text-sm text-black font-bold uppercase">
                噪音清理
              </span>
            </div>
            <span className="text-xl font-black text-black">
              {currentStats.noiseRemovals}
            </span>
          </div>
        </div>
      </div>

      {/* 历史累计高频词 */}
      <div>
        <h3 className="text-sm font-black text-black mb-4 flex items-center gap-2 uppercase">
          <History className="w-5 h-5 text-black stroke-[3px]" />
          <span>历史高频词</span>
          <span className="text-xs font-bold text-gray-500 normal-case">
            (累计 {historicalStats.total_replacements} 次)
          </span>
        </h3>
        <div className="bg-white border-4 border-black p-4 shadow-brutal-md space-y-3">
          {historicalStats.top_terms.length > 0 ? (
            historicalStats.top_terms.slice(0, 8).map((term, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-neo-cream border-2 border-black hover:bg-neo-secondary transition-all duration-100"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-black text-white font-black text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-sm font-bold text-black truncate max-w-[150px]">
                    {term.source}
                  </span>
                </div>
                <span className="text-sm font-black text-black px-2 py-1 bg-neo-accent border-2 border-black">
                  {term.count}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 font-bold">
                暂无历史数据
              </p>
              <p className="text-xs text-gray-400 mt-1">
                处理字幕后将自动累计统计
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 字典状态 */}
      <div>
        <h3 className="text-sm font-black text-black mb-4 flex items-center gap-2 uppercase">
          <Shield className="w-5 h-5 text-black stroke-[3px]" />
          <span>字典状态</span>
        </h3>
        <div className="bg-white border-4 border-black p-5 shadow-brutal-md space-y-3">
          <div className="flex justify-between items-center p-3 bg-neo-muted border-2 border-black">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-black border-2 border-black"></div>
              <span className="text-sm text-black font-bold uppercase">修正规则</span>
            </div>
            <span className="text-base font-black text-black">
              {dictionaryStats.correctionRules.toLocaleString()} 条
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-neo-secondary border-2 border-black">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-black border-2 border-black"></div>
              <span className="text-sm text-black font-bold uppercase">保护词汇</span>
            </div>
            <span className="text-base font-black text-black">
              {dictionaryStats.protectedWords} 个
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-neo-accent border-2 border-black">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-black border-2 border-black"></div>
              <span className="text-sm text-black font-bold uppercase">噪音模式</span>
            </div>
            <span className="text-base font-black text-black">
              {dictionaryStats.noisePatterns} 个
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
