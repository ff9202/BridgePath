'use client';

import { useState, useEffect } from 'react';
import { Route, Send, ChevronDown, ChevronUp, BookOpen, Code, FileText, MessageSquare, Clock, Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import { callAI } from '@/lib/ai';

interface Phase {
  title: string;
  duration: string;
  description: string;
  tasks: Task[];
}

interface Task {
  name: string;
  description: string;
  resources: string;
  completed: boolean;
}

export default function PathPage() {
  const [targetJob, setTargetJob] = useState('');
  const [availableTime, setAvailableTime] = useState('3个月');
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);

  const timeOptions = ['1个月', '2个月', '3个月', '6个月', '1年'];

  useEffect(() => {
    const saved = localStorage.getItem('bridgepath_analysis');
    const savedInput = localStorage.getItem('bridgepath_analysis_input');
    if (saved && savedInput) {
      try {
        const input = JSON.parse(savedInput);
        if (input.targetJob) {
          setTargetJob(input.targetJob);
          setHasAnalysis(true);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const handleGenerate = async () => {
    if (!targetJob.trim()) {
      setError('请填写目标岗位');
      return;
    }

    setLoading(true);
    setError('');
    setPhases([]);

    try {
      const saved = localStorage.getItem('bridgepath_ai_config');
      let apiKey = '';
      let baseUrl = 'https://open.bigmodel.cn/api/paas/v4';
      let model = 'glm-4-flash';

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          apiKey = parsed.apiKey || '';
          baseUrl = parsed.baseUrl || baseUrl;
          model = parsed.model || model;
        } catch {
          // ignore
        }
      }

      if (!apiKey) {
        setError('请先在设置页面配置API Key');
        setLoading(false);
        return;
      }

      // Get analysis data if available
      let analysisContext = '';
      const savedAnalysis = localStorage.getItem('bridgepath_analysis');
      const savedInput = localStorage.getItem('bridgepath_analysis_input');
      if (savedAnalysis && savedInput) {
        try {
          const analysis = JSON.parse(savedAnalysis);
          const input = JSON.parse(savedInput);
          analysisContext = `
之前的分析结果：
- 当前专业：${input.major}
- 核心课程：${input.courses}
- 项目/实习经历：${input.experience}
- 匹配度：${analysis.matchScore}分
- 可迁移能力：${analysis.transferableSkills?.map((s: { name: string }) => s.name).join('、')}
- 需要新学的能力：${analysis.newSkills?.map((s: { name: string; priority: string }) => `${s.name}(${s.priority}优先级)`).join('、')}
- 能力维度：${JSON.stringify(analysis.radarData)}`;
        } catch {
          // ignore
        }
      }

      const systemPrompt = `你是一位专业的职业规划顾问。请根据用户的背景和目标，生成一个分阶段的转型行动计划。

请严格按照以下JSON格式返回（不要添加任何其他文字说明）：
{
  "phases": [
    {
      "title": "阶段名称",
      "duration": "建议时长",
      "description": "阶段目标概述",
      "tasks": [
        {
          "name": "任务名称",
          "description": "任务详细说明",
          "resources": "推荐资源/工具/课程"
        }
      ]
    }
  ]
}

要求：
- 必须包含4个阶段：知识补课、项目实践、简历优化、面试准备
- 每个阶段至少3个具体任务
- 资源推荐要具体，包含平台名称或工具名称
- 根据用户可用时间合理分配各阶段时长
- 任务要可执行、有明确产出`;

      const userPrompt = `请为我生成转型行动计划：

目标岗位：${targetJob}
可用时间：${availableTime}
${analysisContext}

请给出详细的分阶段行动计划。`;

      const result = await callAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const phasesWithCompleted = parsed.phases.map((phase: Phase) => ({
            ...phase,
            tasks: phase.tasks.map((task: Task) => ({
              ...task,
              completed: false,
            })),
          }));
          setPhases(phasesWithCompleted);
          setExpandedPhase(0);
        } else {
          setError('AI返回的数据格式异常，请重试');
        }
      } catch {
        setError('解析AI返回结果失败，请重试');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'NO_API_KEY') {
        setError('请先在设置页面配置API Key');
      } else {
        setError('生成失败，请检查网络连接后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (phaseIndex: number, taskIndex: number) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].tasks[taskIndex].completed = !newPhases[phaseIndex].tasks[taskIndex].completed;
    setPhases(newPhases);
  };

  const getPhaseIcon = (index: number) => {
    switch (index) {
      case 0: return BookOpen;
      case 1: return Code;
      case 2: return FileText;
      case 3: return MessageSquare;
      default: return Sparkles;
    }
  };

  const getPhaseColor = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-cyan-500 to-teal-500',
      'from-violet-500 to-purple-600',
      'from-amber-500 to-orange-500',
    ];
    return colors[index] || colors[0];
  };

  const getPhaseBg = (index: number) => {
    const bgs = [
      'bg-blue-50 border-blue-100',
      'bg-cyan-50 border-cyan-100',
      'bg-violet-50 border-violet-100',
      'bg-amber-50 border-amber-100',
    ];
    return bgs[index] || bgs[0];
  };

  const getPhaseDot = (index: number) => {
    const dots = ['bg-blue-500', 'bg-cyan-500', 'bg-violet-500', 'bg-amber-500'];
    return dots[index] || dots[0];
  };

  const getProgress = () => {
    if (phases.length === 0) return 0;
    const totalTasks = phases.reduce((sum, p) => sum + p.tasks.length, 0);
    const completedTasks = phases.reduce((sum, p) => sum + p.tasks.filter(t => t.completed).length, 0);
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
            <Route className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">行动路径规划</h1>
            <p className="text-sm text-slate-500">生成个性化的分阶段转型行动计划</p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-slate-700 mb-5">设定你的目标</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              目标岗位
            </label>
            <input
              type="text"
              value={targetJob}
              onChange={(e) => setTargetJob(e.target.value)}
              placeholder="例如：产品经理、数据分析师"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              可用时间
            </label>
            <div className="flex gap-2 flex-wrap">
              {timeOptions.map((time) => (
                <button
                  key={time}
                  onClick={() => setAvailableTime(time)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    availableTime === time
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>

        {hasAnalysis && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-100 mb-4">
            <Sparkles className="w-4 h-4 text-green-500" />
            <p className="text-xs text-green-600">已检测到之前的能力分析结果，将基于分析结果生成更精准的计划</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all duration-300"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              生成行动路径
            </>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      {phases.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">整体进度</h3>
            <span className="text-sm font-bold text-blue-600">{getProgress()}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        </div>
      )}

      {/* Timeline */}
      {phases.length > 0 && (
        <div className="relative fade-in">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 via-cyan-300 to-amber-300 hidden sm:block" />

          <div className="space-y-6">
            {phases.map((phase, phaseIndex) => {
              const Icon = getPhaseIcon(phaseIndex);
              const isExpanded = expandedPhase === phaseIndex;
              const completedTasks = phase.tasks.filter(t => t.completed).length;
              const totalTasks = phase.tasks.length;

              return (
                <div key={phaseIndex} className="relative">
                  {/* Timeline dot */}
                  <div className={`absolute left-3.5 w-5 h-5 rounded-full ${getPhaseDot(phaseIndex)} border-4 border-white shadow-md hidden sm:block z-10`} />

                  <div className={`sm:ml-14 rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${getPhaseBg(phaseIndex)}`}>
                    {/* Phase Header */}
                    <button
                      onClick={() => setExpandedPhase(isExpanded ? null : phaseIndex)}
                      className="w-full p-5 text-left flex items-center gap-4 hover:bg-white/50 transition-colors"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getPhaseColor(phaseIndex)} flex items-center justify-center shadow-lg shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-slate-400">阶段 {phaseIndex + 1}</span>
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {phase.duration}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-800">{phase.title}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">{phase.description}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-medium text-slate-400">
                          {completedTasks}/{totalTasks}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Tasks */}
                    {isExpanded && (
                      <div className="px-5 pb-5 space-y-3 fade-in">
                        {phase.tasks.map((task, taskIndex) => (
                          <div
                            key={taskIndex}
                            className={`p-4 rounded-xl border bg-white/80 transition-all ${
                              task.completed ? 'border-green-200 bg-green-50/30' : 'border-slate-200'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => toggleTask(phaseIndex, taskIndex)}
                                className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                  task.completed
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-slate-300 hover:border-blue-400'
                                }`}
                              >
                                {task.completed && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-semibold text-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                  {task.name}
                                </h4>
                                <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                                {task.resources && (
                                  <div className="flex items-start gap-1.5 mt-2">
                                    <BookOpen className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
                                    <p className="text-xs text-blue-600">{task.resources}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && phases.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 flex items-center justify-center mx-auto mb-5">
            <Route className="w-10 h-10 text-cyan-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">规划你的转型之路</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            填写目标岗位和可用时间，AI将为你生成包含知识补课、项目实践、简历优化和面试准备四个阶段的详细行动计划
          </p>
        </div>
      )}
    </div>
  );
}
