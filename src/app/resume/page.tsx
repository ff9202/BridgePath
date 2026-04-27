'use client';

import { useState } from 'react';
import { FileText, Send, Copy, Check, Loader2, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { callAI } from '@/lib/ai';

export default function ResumePage() {
  const [resume, setResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);

  const handleTranslate = async () => {
    if (!resume.trim()) {
      setError('请粘贴你的简历内容');
      return;
    }
    if (!jobDescription.trim()) {
      setError('请输入目标岗位的职位描述');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');
    setKeywords([]);

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

      const systemPrompt = `你是一位资深的简历优化专家，擅长帮助跨专业求职者将简历"翻译"成目标岗位的语言。

请完成以下任务：
1. 分析目标岗位JD中的关键能力要求
2. 将用户简历中的经历用目标岗位的语言重新表述
3. 突出可迁移能力，弱化不相关的经历
4. 使用目标岗位的术语和关键词

请严格按照以下JSON格式返回（不要添加任何其他文字说明）：
{
  "rewrittenResume": "改写后的完整简历文本",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "changes": [
    {
      "original": "原文片段",
      "rewritten": "改写后片段",
      "reason": "改写原因"
    }
  ]
}

注意：
- rewrittenResume 要保持简历的完整性，包含所有必要板块
- keywords 是从JD中提取并在改写中使用的核心关键词
- changes 列出主要的改写点，帮助用户理解改写逻辑
- 改写要真实，不要编造经历，而是重新表述已有经历`;

      const userPrompt = `请帮我"翻译"以下简历，使其更匹配目标岗位：

【原始简历】
${resume}

【目标岗位JD】
${jobDescription}

请将简历改写为更匹配目标岗位的版本。`;

      const response = await callAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setResult(parsed.rewrittenResume || '');
          setKeywords(parsed.keywords || []);
        } else {
          // If no JSON found, use the raw text
          setResult(response);
        }
      } catch {
        setError('解析AI返回结果失败，请重试');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'NO_API_KEY') {
        setError('请先在设置页面配置API Key');
      } else {
        setError('改写失败，请检查网络连接后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = result;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const highlightKeywords = (text: string) => {
    if (keywords.length === 0) return text;
    let highlighted = text;
    keywords.forEach((keyword) => {
      const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      highlighted = highlighted.replace(regex, `<span class="keyword-highlight">$&</span>`);
    });
    return highlighted;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">简历翻译器</h1>
            <p className="text-sm text-slate-500">将你的经历翻译成目标岗位的语言</p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Original Resume */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-700">原始简历</h2>
            <span className="text-xs text-slate-400">粘贴你的简历内容</span>
          </div>
          <textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder="在此粘贴你的简历内容...&#10;&#10;例如：&#10;教育背景：XX大学 汉语言文学专业&#10;实习经历：XX公司 内容运营实习生&#10;技能：文案写作、新媒体运营、活动策划"
            rows={12}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none leading-relaxed"
          />
        </div>

        {/* Job Description */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-700">目标岗位JD</h2>
            <span className="text-xs text-slate-400">粘贴职位描述</span>
          </div>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="在此粘贴目标岗位的职位描述...&#10;&#10;例如：&#10;岗位职责：&#10;1. 负责产品需求分析和方案设计&#10;2. 协调开发和设计团队推进项目&#10;&#10;任职要求：&#10;1. 本科及以上学历&#10;2. 具备数据分析能力"
            rows={12}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 flex-1">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}
        <button
          onClick={handleTranslate}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all duration-300 shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              翻译中...
            </>
          ) : (
            <>
              <ArrowRightLeft className="w-4 h-4" />
              开始翻译
            </>
          )}
        </button>
      </div>

      {/* Result Section */}
      {result && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-700">改写后的简历</h2>
              {keywords.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {keywords.slice(0, 5).map((kw) => (
                    <span key={kw} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100">
                      {kw}
                    </span>
                  ))}
                  {keywords.length > 5 && (
                    <span className="text-xs text-slate-400">+{keywords.length - 5}</span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                copied
                  ? 'bg-green-50 text-green-600 border border-green-200'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  复制
                </>
              )}
            </button>
          </div>

          <div
            className="p-5 rounded-xl bg-slate-50 border border-slate-100 text-sm leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: highlightKeywords(result) }}
          />

          {keywords.length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <h4 className="text-xs font-semibold text-blue-700 mb-2">关键词高亮说明</h4>
              <p className="text-xs text-blue-600 leading-relaxed">
                蓝色高亮部分为从目标岗位JD中提取的核心关键词，这些关键词已被融入改写后的简历中，以提高ATS（简历筛选系统）的匹配度。
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !result && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center mx-auto mb-5">
            <FileText className="w-10 h-10 text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">简历翻译</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            在左侧粘贴你的简历，在右侧粘贴目标岗位JD，AI将帮你把简历"翻译"成目标岗位的语言，突出可迁移能力
          </p>
        </div>
      )}
    </div>
  );
}
