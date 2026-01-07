'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, Search, BookOpen, Shield, AlertCircle, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { API_BASE } from '@/lib/config'

interface CorrectionTerm {
  source: string
  target: string
  category: string
}

interface ShieldingData {
  protected_words: string[]
}

interface CorrectionData {
  terms: CorrectionTerm[]
  noise_patterns: string[]
}

interface Stats {
  correction_terms: number
  protected_words: number
  noise_patterns: number
}

export default function DictionaryPage() {
  const [activeTab, setActiveTab] = useState<'correction' | 'shielding'>('correction')
  const [correctionData, setCorrectionData] = useState<CorrectionData>({ terms: [], noise_patterns: [] })
  const [shieldingData, setShieldingData] = useState<ShieldingData>({ protected_words: [] })
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingData, setEditingData] = useState<CorrectionTerm | null>(null)
  const [editingShieldIndex, setEditingShieldIndex] = useState<number | null>(null)
  const [editingShieldWord, setEditingShieldWord] = useState<string>('')
  const [isAddingShield, setIsAddingShield] = useState(false)
  const [newShieldWord, setNewShieldWord] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const initialLoadDone = useRef(false)

  // 自动保存函数
  const autoSave = useCallback(async (type: 'correction' | 'shielding', data: any) => {
    setIsSaving(true)
    setSaveStatus('saving')
    try {
      const res = await fetch(`${API_BASE}/dictionaries/${type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        throw new Error('保存失败')
      }

      setSaveStatus('saved')
      setHasUnsavedChanges(false)
      // 3秒后恢复idle状态
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      setSaveStatus('error')
      console.error('自动保存失败:', err)
    } finally {
      setIsSaving(false)
    }
  }, [])

  // 触发自动保存（带防抖）
  const triggerAutoSave = useCallback((type: 'correction' | 'shielding', data: any) => {
    setHasUnsavedChanges(true)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(type, data)
    }, 1000) // 1秒后自动保存
  }, [autoSave])

  // 获取数据
  useEffect(() => {
    loadData()
  }, [activeTab])

  // 清理timeout
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, dictRes] = await Promise.all([
        fetch(`${API_BASE}/dictionaries/stats`),
        fetch(`${API_BASE}/dictionaries/${activeTab === 'correction' ? 'correction' : 'shielding'}`)
      ])

      if (!statsRes.ok || !dictRes.ok) {
        throw new Error('获取数据失败')
      }

      const statsData = await statsRes.json()
      const dictData = await dictRes.json()

      setStats(statsData)
      if (activeTab === 'correction') {
        setCorrectionData(dictData)
      } else {
        setShieldingData(dictData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // 清除任何待处理的自动保存
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    setIsSaving(true)
    setSaveStatus('saving')

    try {
      const endpoint = activeTab === 'correction' ? 'correction' : 'shielding'
      const data = activeTab === 'correction' ? correctionData : shieldingData

      const res = await fetch(`${API_BASE}/dictionaries/${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        throw new Error('保存失败')
      }

      setSaveStatus('saved')
      setHasUnsavedChanges(false)
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      setSaveStatus('error')
      alert(err instanceof Error ? err.message : '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddTerm = () => {
    if (activeTab === 'correction') {
      setCorrectionData({
        ...correctionData,
        terms: [...correctionData.terms, { source: '', target: '', category: '术语映射' }]
      })
      setEditingIndex(correctionData.terms.length)
      setEditingData({ source: '', target: '', category: '术语映射' })
    } else {
      setIsAddingShield(true)
      setNewShieldWord('')
    }
  }

  const handleAddShieldWord = () => {
    if (!newShieldWord.trim()) return
    const newData = {
      ...shieldingData,
      protected_words: [...shieldingData.protected_words, newShieldWord.trim()]
    }
    setShieldingData(newData)
    setIsAddingShield(false)
    setNewShieldWord('')
    triggerAutoSave('shielding', newData)
  }

  const handleCancelAddShield = () => {
    setIsAddingShield(false)
    setNewShieldWord('')
  }

  const handleEditShield = (index: number, word: string) => {
    setEditingShieldIndex(index)
    setEditingShieldWord(word)
  }

  const handleSaveShieldEdit = () => {
    if (editingShieldIndex === null || !editingShieldWord.trim()) return
    const newWords = [...shieldingData.protected_words]
    newWords[editingShieldIndex] = editingShieldWord.trim()
    const newData = { ...shieldingData, protected_words: newWords }
    setShieldingData(newData)
    setEditingShieldIndex(null)
    setEditingShieldWord('')
    triggerAutoSave('shielding', newData)
  }

  const handleCancelShieldEdit = () => {
    setEditingShieldIndex(null)
    setEditingShieldWord('')
  }

  const handleDeleteTerm = (index: number) => {
    if (!confirm('确定要删除吗？')) return

    if (activeTab === 'correction') {
      const newData = {
        ...correctionData,
        terms: correctionData.terms.filter((_, i) => i !== index)
      }
      setCorrectionData(newData)
      triggerAutoSave('correction', newData)
    } else {
      const newData = {
        ...shieldingData,
        protected_words: shieldingData.protected_words.filter((_, i) => i !== index)
      }
      setShieldingData(newData)
      triggerAutoSave('shielding', newData)
    }
  }

  const handleEditTerm = (index: number) => {
    if (activeTab === 'correction') {
      setEditingIndex(index)
      setEditingData({ ...correctionData.terms[index] })
    }
  }

  const handleSaveEdit = () => {
    if (editingIndex === null || !editingData) return

    // 检查是否有有效内容
    if (!editingData.source.trim() || !editingData.target.trim()) {
      alert('原文和修正为不能为空')
      return
    }

    const newTerms = [...correctionData.terms]
    newTerms[editingIndex] = editingData
    const newData = { ...correctionData, terms: newTerms }
    setCorrectionData(newData)
    setEditingIndex(null)
    setEditingData(null)
    triggerAutoSave('correction', newData)
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditingData(null)
  }

  const filteredTerms = activeTab === 'correction'
    ? correctionData.terms.filter(term =>
        term.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : shieldingData.protected_words.filter(word =>
        word && word.trim() && word.toLowerCase().includes(searchTerm.toLowerCase())
      )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neo-cream">
        <div className="text-center">
          <div className="inline-block animate-spin w-16 h-16 border-4 border-black border-t-neo-accent"></div>
          <p className="mt-4 text-black font-bold uppercase tracking-wide">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neo-cream">
        <div className="text-center max-w-md bg-white border-4 border-black p-8 shadow-brutal-lg">
          <AlertCircle className="w-16 h-16 text-black mx-auto mb-4 stroke-[3px]" />
          <h2 className="text-3xl font-black text-black mb-4 uppercase">加载失败</h2>
          <p className="text-black font-bold mb-6">{error}</p>
          <div className="flex gap-4">
            <button
              onClick={loadData}
              className="btn-brutal-primary flex-1"
            >
              重试
            </button>
            <Link
              href="/"
              className="btn-brutal-outline flex-1 inline-flex items-center justify-center"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neo-cream">
      {/* Header */}
      <header className="bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="w-12 h-12 bg-neo-accent border-4 border-black shadow-brutal hover:shadow-brutal-md active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 flex items-center justify-center"
              >
                <ArrowLeft className="w-6 h-6 text-black stroke-[3px]" />
              </Link>
              <div>
                <h1 className="text-3xl font-black text-black uppercase tracking-tight">字典管理</h1>
                <p className="text-sm text-black font-bold mt-1 uppercase tracking-wide">管理修正规则和保护词库</p>
              </div>
            </div>
            {/* 自动保存状态指示器 */}
            <div className="flex items-center gap-3">
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-neo-muted border-2 border-black">
                  <Loader2 className="w-4 h-4 animate-spin stroke-[3px]" />
                  <span className="text-sm font-bold">保存中...</span>
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-200 border-2 border-black">
                  <Check className="w-4 h-4 stroke-[3px] text-green-700" />
                  <span className="text-sm font-bold text-green-700">已保存</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-200 border-2 border-black">
                  <AlertCircle className="w-4 h-4 stroke-[3px] text-red-700" />
                  <span className="text-sm font-bold text-red-700">保存失败</span>
                </div>
              )}
              {saveStatus === 'idle' && hasUnsavedChanges && (
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-200 border-2 border-black">
                  <span className="text-sm font-bold text-yellow-700">有未保存更改</span>
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-brutal-primary flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5 stroke-[3px]" />
                手动保存
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      {stats && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-neo-secondary border-4 border-black p-6 shadow-brutal-md hover:shadow-brutal-lg hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white border-4 border-black flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-black stroke-[3px]" />
                </div>
                <div>
                  <p className="text-xs text-black font-bold uppercase tracking-widest">修正术语</p>
                  <p className="text-4xl font-black text-black">{stats.correction_terms}</p>
                </div>
              </div>
            </div>
            <div className="bg-neo-accent border-4 border-black p-6 shadow-brutal-md hover:shadow-brutal-lg hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white border-4 border-black flex items-center justify-center">
                  <Shield className="w-7 h-7 text-black stroke-[3px]" />
                </div>
                <div>
                  <p className="text-xs text-black font-bold uppercase tracking-widest">保护词</p>
                  <p className="text-4xl font-black text-black">{stats.protected_words}</p>
                </div>
              </div>
            </div>
            <div className="bg-neo-muted border-4 border-black p-6 shadow-brutal-md hover:shadow-brutal-lg hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white border-4 border-black flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-black stroke-[3px]" />
                </div>
                <div>
                  <p className="text-xs text-black font-bold uppercase tracking-widest">噪音模式</p>
                  <p className="text-4xl font-black text-black">{stats.noise_patterns}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white border-4 border-b-0 border-black">
          <div className="flex gap-2 p-2">
            <button
              onClick={() => setActiveTab('correction')}
              className={`flex-1 px-6 py-4 font-bold uppercase tracking-wide transition-all duration-100 ${
                activeTab === 'correction'
                  ? 'bg-neo-accent text-black border-4 border-black shadow-brutal'
                  : 'text-black bg-white border-2 border-transparent hover:border-black hover:shadow-brutal-sm'
              }`}
            >
              <BookOpen className="w-5 h-5 inline-block mr-2 stroke-[3px]" />
              修正规则库
            </button>
            <button
              onClick={() => setActiveTab('shielding')}
              className={`flex-1 px-6 py-4 font-bold uppercase tracking-wide transition-all duration-100 ${
                activeTab === 'shielding'
                  ? 'bg-neo-accent text-black border-4 border-black shadow-brutal'
                  : 'text-black bg-white border-2 border-transparent hover:border-black hover:shadow-brutal-sm'
              }`}
            >
              <Shield className="w-5 h-5 inline-block mr-2 stroke-[3px]" />
              保护词库
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="bg-white border-4 border-t-0 border-black p-6 shadow-brutal-lg">
          {/* Search and Add */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-black absolute left-4 top-1/2 transform -translate-y-1/2 stroke-[3px]" />
              <input
                type="text"
                placeholder="搜索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-brutal w-full pl-12"
              />
            </div>
            <button
              onClick={handleAddTerm}
              className="btn-brutal-secondary flex items-center gap-2"
            >
              <Plus className="w-5 h-5 stroke-[3px]" />
              添加
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {activeTab === 'correction' ? (
              <table className="w-full border-4 border-black">
                <thead>
                  <tr className="bg-neo-secondary border-b-4 border-black">
                    <th className="text-left py-4 px-6 text-sm font-black text-black uppercase tracking-wider">原文</th>
                    <th className="text-left py-4 px-6 text-sm font-black text-black uppercase tracking-wider">修正为</th>
                    <th className="text-left py-4 px-6 text-sm font-black text-black uppercase tracking-wider">分类</th>
                    <th className="text-right py-4 px-6 text-sm font-black text-black uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTerms.map((term: any, index) => {
                    const actualIndex = correctionData.terms.findIndex(t => t === term)
                    const isEditing = editingIndex === actualIndex

                    return (
                      <tr key={actualIndex} className="border-b-2 border-black hover:bg-neo-cream transition-all duration-100">
                        {isEditing ? (
                          <>
                            <td className="py-4 px-6">
                              <input
                                type="text"
                                value={editingData?.source || ''}
                                onChange={(e) => setEditingData({ ...editingData!, source: e.target.value })}
                                className="input-brutal w-full"
                              />
                            </td>
                            <td className="py-4 px-6">
                              <input
                                type="text"
                                value={editingData?.target || ''}
                                onChange={(e) => setEditingData({ ...editingData!, target: e.target.value })}
                                className="input-brutal w-full"
                              />
                            </td>
                            <td className="py-4 px-6">
                              <input
                                type="text"
                                value={editingData?.category || ''}
                                onChange={(e) => setEditingData({ ...editingData!, category: e.target.value })}
                                className="input-brutal w-full"
                              />
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={handleSaveEdit}
                                className="p-2 bg-neo-secondary border-2 border-black hover:shadow-brutal-sm mr-2"
                              >
                                <Save className="w-5 h-5 text-black stroke-[3px]" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-2 bg-white border-2 border-black hover:shadow-brutal-sm"
                              >
                                <X className="w-5 h-5 text-black stroke-[3px]" />
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-4 px-6 text-sm text-black font-bold">{term.source}</td>
                            <td className="py-4 px-6 text-sm text-black font-bold">{term.target}</td>
                            <td className="py-4 px-6">
                              <span className="inline-block px-3 py-1 bg-neo-muted border-2 border-black text-black font-bold text-xs whitespace-nowrap">
                                {term.category}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handleEditTerm(actualIndex)}
                                className="p-2 bg-white border-2 border-black hover:shadow-brutal-sm mr-2"
                              >
                                <Edit2 className="w-5 h-5 text-black stroke-[3px]" />
                              </button>
                              <button
                                onClick={() => handleDeleteTerm(actualIndex)}
                                className="p-2 bg-neo-accent border-2 border-black hover:shadow-brutal-sm"
                              >
                                <Trash2 className="w-5 h-5 text-black stroke-[3px]" />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {/* 添加新保护词输入框 */}
                {isAddingShield && (
                  <div className="p-4 border-4 border-neo-accent bg-neo-cream shadow-brutal">
                    <input
                      type="text"
                      value={newShieldWord}
                      onChange={(e) => setNewShieldWord(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddShieldWord()
                        if (e.key === 'Escape') handleCancelAddShield()
                      }}
                      placeholder="输入保护词..."
                      className="input-brutal w-full mb-2 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddShieldWord}
                        className="flex-1 p-1 bg-neo-secondary border-2 border-black text-xs font-bold hover:shadow-brutal-sm"
                      >
                        确定
                      </button>
                      <button
                        onClick={handleCancelAddShield}
                        className="flex-1 p-1 bg-white border-2 border-black text-xs font-bold hover:shadow-brutal-sm"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
                {filteredTerms.map((word: any, index) => {
                  const actualIndex = shieldingData.protected_words.findIndex(w => w === word)
                  const isEditing = editingShieldIndex === actualIndex

                  if (isEditing) {
                    return (
                      <div
                        key={actualIndex}
                        className="p-4 border-4 border-neo-accent bg-neo-cream shadow-brutal"
                      >
                        <input
                          type="text"
                          value={editingShieldWord}
                          onChange={(e) => setEditingShieldWord(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveShieldEdit()
                            if (e.key === 'Escape') handleCancelShieldEdit()
                          }}
                          className="input-brutal w-full mb-2 text-sm"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveShieldEdit}
                            className="flex-1 p-1 bg-neo-secondary border-2 border-black text-xs font-bold hover:shadow-brutal-sm"
                          >
                            保存
                          </button>
                          <button
                            onClick={handleCancelShieldEdit}
                            className="flex-1 p-1 bg-white border-2 border-black text-xs font-bold hover:shadow-brutal-sm"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={actualIndex}
                      className="p-4 border-2 border-black bg-white hover:bg-neo-secondary hover:border-4 hover:shadow-brutal transition-all duration-100 group cursor-pointer"
                      onDoubleClick={() => handleEditShield(actualIndex, word)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-black font-bold">{word}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditShield(actualIndex, word)}
                            className="opacity-0 group-hover:opacity-100 p-1 bg-white border-2 border-black transition"
                          >
                            <Edit2 className="w-4 h-4 text-black stroke-[3px]" />
                          </button>
                          <button
                            onClick={() => handleDeleteTerm(actualIndex)}
                            className="opacity-0 group-hover:opacity-100 p-1 bg-neo-accent border-2 border-black transition"
                          >
                            <Trash2 className="w-4 h-4 text-black stroke-[3px]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {filteredTerms.length === 0 && !isAddingShield && (
            <div className="text-center py-16 border-4 border-black bg-neo-cream">
              <p className="text-black font-black text-xl uppercase">没有找到相关内容</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
