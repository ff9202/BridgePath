'use client';

import { useState } from 'react';
import { BarChart3, Send, RotateCcw, CheckCircle, AlertTriangle, ArrowUpRight, BookOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface TransferableSkill {
  name: string;
  description: string;
  matchExplanation: string;
  relevance: number;
}

interface NewSkill {
  name: string;
  reason: string;
  priority: string;
  resources: string;
}

interface RadarData {
  [key: string]: number;
}

interface AnalysisResult {
  matchScore: number;
  summary: string;
  transferableSkills: TransferableSkill[];
  newSkills: NewSkill[];
  radarData: RadarData;
}

function RadarChart({ data }: { data: RadarData }) {
  const labels = Object.keys(data);
  const values = Object.values(data);
  const n = labels.length;
  const size = 280;
  const center = size / 2;
  const maxRadius = 110;
  const levels = 5;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const r = (value / 100) * maxRadius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const gridPolygons = Array.from({ length: levels }, (_, level) => {
    const r = (maxRadius * (level + 1)) / levels;
    const points = Array.from({ length: n }, (_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(' ');
    return points;
  });

  const dataPoints = values.map((v, i) => getPoint(i, v));
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  const labelPositions = labels.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return {
      x: center + (maxRadius + 28) * Math.cos(angle),
      y: center + (maxRadius + 28) * Math.sin(angle),
    };
  });

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#10B981';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid */}
        {gridPolygons.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {labels.map((_, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={center + maxRadius * Math.cos(angle)}
              y2={center + maxRadius * Math.sin(angle)}
              stroke="#E2E8F0"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={dataPolygon}
          fill="rgba(37, 99, 235, 0.15)"
          stroke="#2563EB"
          strokeWidth="2"
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#2563EB"
            stroke="white"
            strokeWidth="2"
          />
        ))}

        {/* Labels */}
        {labels.map((label, i) => (
          <text
            key={i}
            x={labelPositions[i].x}
            y={labelPositions[i].y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs"
            fill="#475569"
            fontSize="11"
            fontWeight="500"
          >
            {label}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-2">
        {labels.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: getScoreColor(values[i]) }}
            />
            <span className="text-xs text-slate-500">{label} {values[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  const [major, setMajor] = useState('');
  const [courses, setCourses] = useState('');
  const [experience, setExperience] = useState('');
  const [targetJob, setTargetJob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [streamingText, setStreamingText] = useState('');

  const handleAnalyze = async () => {
    if (!major.trim() || !targetJob.trim()) {
      setError('请至少填写当前专业和目标岗位');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setStreamingText('');

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

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'x-base-url': baseUrl,
          'x-model': model,
        },
        body: JSON.stringify({
          major: major.trim(),
          courses: courses.trim(),
          experience: experience.trim(),
          targetJob: targetJob.trim(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        setError(errData.error || errData.message || '分析失败，请重试');
        setLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setError('无法读取响应');
        setLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setStreamingText(fullText);
      }

      // Parse JSON from the streamed text
      try {
        const jsonMatch = fullText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setResult(parsed);
          // Save to localStorage for path page
          localStorage.setItem('bridgepath_analysis', JSON.stringify(parsed));
          localStorage.setItem('bridgepath_analysis_input', JSON.stringify({
            major: major.trim(),
            courses: courses.trim(),
            experience: experience.trim(),
            targetJob: targetJob.trim(),
          }));
        } else {
          setError('AI返回的数据格式异常，请重试');
        }
      } catch {
        setError('解析AI返回结果失败，请重试');
      }
    } catch (err) {
      setError('网络错误，请检查网络连接后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setStreamingText('');
    setError('');
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'from-green-500 to-emerald-500';
    if (score >= 40) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case '高': return 'bg-red-50 text-red-600 border-red-200';
      case '中': return 'bg-amber-50 text-amber-600 border-amber-200';
      default: return 'bg-green-50 text-green-600 border-green-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">能力迁移图谱</h1>
            <p className="text-sm text-slate-500">分析你的专业背景与目标岗位的匹配度</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Input Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-24">
            <h2 className="text-base font-semibold text-slate-700 mb-5">填写你的背景信息</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  当前专业 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="例如：汉语言文学、机械工程"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  核心课程
                </label>
                <textarea
                  value={courses}
                  onChange={(e) => setCourses(e.target.value)}
                  placeholder="列出你的主要课程，每行一个&#10;例如：&#10;古代文学&#10;现代汉语&#10;写作学"
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  项目/实习经历
                </label>
                <textarea
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="描述你的项目或实习经历&#10;例如：&#10;在某互联网公司实习3个月，负责内容运营"
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  目标岗位 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={targetJob}
                  onChange={(e) => setTargetJob(e.target.value)}
                  placeholder="例如：产品经理、数据分析师"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all duration-300"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      开始分析
                    </>
                  )}
                </button>
                {result && (
                  <button
                    onClick={handleReset}
                    className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-3">
          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center fade-in">
              <div className="flex justify-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-blue-500 loading-dot" />
                <div className="w-3 h-3 rounded-full bg-cyan-500 loading-dot" />
                <div className="w-3 h-3 rounded-full bg-blue-500 loading-dot" />
              </div>
              <p className="text-slate-500 text-sm mb-2">AI正在分析你的能力迁移情况...</p>
              {streamingText && (
                <pre className="text-left text-xs text-slate-400 bg-slate-50 rounded-xl p-4 max-h-40 overflow-auto mt-4 whitespace-pre-wrap">
                  {streamingText}
                </pre>
              )}
            </div>
          )}

          {/* Empty State */}
          {!loading && !result && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center mx-auto mb-5">
                <BarChart3 className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">等待分析</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                在左侧填写你的专业背景和目标岗位，AI将为你生成详细的能力迁移分析报告
              </p>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div className="space-y-6 fade-in">
              {/* Match Score */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">整体匹配度</h3>
                <div className="flex items-center gap-6">
                  <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${getScoreBg(result.matchScore)} flex items-center justify-center shadow-lg`}>
                    <span className="text-3xl font-extrabold text-white">{result.matchScore}</span>
                  </div>
                  <div>
                    <p className="text-slate-700 font-medium mb-1">{result.summary}</p>
                    <p className={`text-sm font-medium ${getScoreColor(result.matchScore)}`}>
                      {result.matchScore >= 70 ? '匹配度较高，转型前景良好' :
                       result.matchScore >= 40 ? '有一定基础，需要针对性补强' :
                       '跨度较大，建议制定详细学习计划'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Radar Chart */}
              {result.radarData && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">能力维度对比</h3>
                  <RadarChart data={result.radarData} />
                </div>
              )}

              {/* Transferable Skills */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <h3 className="text-sm font-semibold text-slate-700">可迁移能力</h3>
                </div>
                <div className="space-y-3">
                  {result.transferableSkills?.map((skill, index) => (
                    <div key={index} className="p-4 rounded-xl bg-green-50/50 border border-green-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-slate-800">{skill.name}</h4>
                        <div className="flex items-center gap-1">
                          <div className="w-16 h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                              style={{ width: `${skill.relevance}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-green-600">{skill.relevance}%</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 mb-1">{skill.description}</p>
                      <div className="flex items-start gap-1.5 mt-2">
                        <ArrowUpRight className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-green-700">{skill.matchExplanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* New Skills */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-semibold text-slate-700">需要新学的能力</h3>
                </div>
                <div className="space-y-3">
                  {result.newSkills?.map((skill, index) => (
                    <div key={index} className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-slate-800">{skill.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(skill.priority)}`}>
                          {skill.priority}优先级
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mb-1">{skill.reason}</p>
                      {skill.resources && (
                        <div className="flex items-start gap-1.5 mt-2">
                          <BookOpen className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-sm text-amber-700">{skill.resources}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Step */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">分析完成！下一步做什么？</h3>
                    <p className="text-sm text-slate-500">基于分析结果，为你生成个性化的转型行动计划</p>
                  </div>
                  <Link
                    href="/path"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 whitespace-nowrap"
                  >
                    查看行动路径
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
