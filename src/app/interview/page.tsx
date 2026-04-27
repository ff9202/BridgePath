'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, RotateCcw, User, Bot, Loader2, AlertTriangle, FileText, Sparkles, ChevronRight } from 'lucide-react';
import { streamAI } from '@/lib/ai';

interface Message {
  role: 'user' | 'ai' | 'system';
  content: string;
}

interface InterviewConfig {
  background: string;
  targetJob: string;
}

export default function InterviewPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'config' | 'interview' | 'report'>('config');
  const [config, setConfig] = useState<InterviewConfig>({ background: '', targetJob: '' });
  const [report, setReport] = useState('');
  const [interviewCount, setInterviewCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startInterview = async () => {
    if (!config.background.trim() || !config.targetJob.trim()) {
      setError('请填写背景信息和目标岗位');
      return;
    }

    setPhase('interview');
    setMessages([]);
    setError('');
    setInterviewCount(0);

    // Initial AI greeting
    const initialMessage: Message = {
      role: 'ai',
      content: `你好！我是你的面试官。感谢你来参加${config.targetJob}岗位的面试。

我注意到你的背景是：${config.background}

作为跨专业求职者，我很想了解你是如何准备这次面试的。让我们从第一个问题开始：

请简单做一个自我介绍，重点说说你为什么想要转行做${config.targetJob}，以及你认为自己最大的优势是什么？`,
    };

    setMessages([initialMessage]);
    setInterviewCount(1);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError('');

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

      const systemPrompt = `你是一位专业且友善的面试官，正在面试一位跨专业求职者。

候选人背景：${config.background}
目标岗位：${config.targetJob}

面试要求：
1. 针对候选人的跨专业背景提问，不要回避跨界话题
2. 问题要有深度，考察候选人的真实能力和思考
3. 语气专业但友善，给候选人鼓励
4. 每次只问1-2个问题
5. 根据候选人的回答灵活追问
6. 重点关注：转行动机、学习能力、可迁移能力、职业规划
7. 面试大约进行5-8轮对话
8. 当你觉得面试足够充分时，在回复末尾加上"[面试结束]"标记

注意：保持自然对话风格，不要像机器人一样生硬。`;

      const chatHistory = newMessages.map((m) => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content,
      }));

      let aiResponse = '';
      const aiMessage: Message = { role: 'ai', content: '' };

      try {
        for await (const chunk of streamAI([
          { role: 'system', content: systemPrompt },
          ...chatHistory,
        ])) {
          aiResponse += chunk;
          aiMessage.content = aiResponse;
          setMessages([...newMessages, { ...aiMessage }]);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'NO_API_KEY') {
          setError('请先在设置页面配置API Key');
        } else {
          setError('AI响应失败，请重试');
        }
      }

      // Check if interview ended
      if (aiResponse.includes('[面试结束]')) {
        setInterviewCount((prev) => prev + 1);
        // Generate report
        setTimeout(() => generateReport(newMessages, aiResponse), 500);
      } else {
        setInterviewCount((prev) => prev + 1);
      }
    } catch {
      setError('发送失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (conversation: Message[], lastResponse: string) => {
    setLoading(true);
    setPhase('report');

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
        setReport('无法生成报告：未配置API Key');
        setLoading(false);
        return;
      }

      const cleanLastResponse = lastResponse.replace('[面试结束]', '').trim();

      const reportPrompt = `基于以下面试对话，生成一份面试评估报告。

候选人背景：${config.background}
目标岗位：${config.targetJob}

面试对话：
${conversation.map((m) => `${m.role === 'user' ? '候选人' : '面试官'}：${m.content}`).join('\n\n')}

请生成详细的面试评估报告，包括：
1. 总体评价（1-2句话）
2. 优势亮点（至少3点）
3. 需要改进的地方（至少2点）
4. 综合评分（0-100分）
5. 具体建议（如何提升面试表现）`;

      const result = await streamAI([
        { role: 'system', content: '你是一位资深的HR面试评估专家，请给出专业、客观、有建设性的面试评估报告。' },
        { role: 'user', content: reportPrompt },
      ]);

      let reportText = '';
      for await (const chunk of result) {
        reportText += chunk;
        setReport(reportText);
      }
    } catch {
      setReport('生成报告失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPhase('config');
    setMessages([]);
    setInput('');
    setError('');
    setReport('');
    setInterviewCount(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">模拟面试</h1>
              <p className="text-sm text-slate-500">AI扮演面试官，模拟真实面试场景</p>
            </div>
          </div>
          {(phase === 'interview' || phase === 'report') && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              重新开始
            </button>
          )}
        </div>
      </div>

      {/* Config Phase */}
      {phase === 'config' && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">开始模拟面试</h2>
              <p className="text-sm text-slate-500">填写你的背景信息，AI将扮演面试官与你对话</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  你的背景信息
                </label>
                <textarea
                  value={config.background}
                  onChange={(e) => setConfig({ ...config, background: e.target.value })}
                  placeholder="例如：我是XX大学汉语言文学专业大四学生，有3个月新媒体运营实习经历，想转行做产品经理"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  目标岗位
                </label>
                <input
                  type="text"
                  value={config.targetJob}
                  onChange={(e) => setConfig({ ...config, targetJob: e.target.value })}
                  placeholder="例如：产品经理"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <button
                onClick={startInterview}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] transition-all duration-300"
              >
                <Sparkles className="w-4 h-4" />
                开始面试
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interview Phase */}
      {phase === 'interview' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-slate-700">面试进行中</span>
              <span className="text-xs text-slate-400">第 {interviewCount} 轮</span>
            </div>
            <span className="text-xs text-slate-400">{config.targetJob} 岗位面试</span>
          </div>

          {/* Messages */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} fade-in`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                    : 'bg-gradient-to-br from-amber-400 to-orange-500'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Bubble */}
                <div className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'chat-bubble-user'
                    : 'chat-bubble-ai'
                }`}>
                  {msg.content}
                  {msg.role === 'ai' && loading && index === messages.length - 1 && (
                    <span className="typing-cursor" />
                  )}
                </div>
              </div>
            ))}

            {loading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3 fade-in">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="chat-bubble-ai px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-slate-300 loading-dot" />
                    <div className="w-2 h-2 rounded-full bg-slate-300 loading-dot" />
                    <div className="w-2 h-2 rounded-full bg-slate-300 loading-dot" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t border-slate-100">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}
            <div className="flex gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入你的回答..."
                rows={1}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 disabled:opacity-50 disabled:hover:shadow-amber-500/25 transition-all duration-300"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Phase */}
      {phase === 'report' && (
        <div className="space-y-6 fade-in">
          {/* Report Header */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">面试评估报告</h2>
                <p className="text-sm text-slate-500">{config.targetJob} 岗位模拟面试</p>
              </div>
            </div>
          </div>

          {/* Report Content */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-500">正在生成面试评估报告...</p>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {report}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {!loading && report && (
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] transition-all duration-300"
              >
                <RotateCcw className="w-4 h-4" />
                再来一次
              </button>
              <button
                onClick={() => setPhase('interview')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-700 font-semibold text-sm border border-slate-200 hover:border-amber-300 hover:text-amber-600 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
                查看对话记录
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
