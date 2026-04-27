'use client';

import Link from 'next/link';
import { BarChart3, Route, FileText, MessageSquare, ArrowRight, Sparkles, Target, Users, TrendingUp } from 'lucide-react';

const features = [
  {
    href: '/analyze',
    icon: BarChart3,
    title: '能力迁移图谱',
    description: 'AI分析你的专业背景与目标岗位的匹配度，发现可迁移的核心能力',
    gradient: 'from-blue-500 to-blue-600',
    shadowColor: 'shadow-blue-500/20',
    bgLight: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    href: '/path',
    icon: Route,
    title: '行动路径规划',
    description: '根据你的时间安排，生成个性化的分阶段转型行动计划',
    gradient: 'from-cyan-500 to-teal-500',
    shadowColor: 'shadow-cyan-500/20',
    bgLight: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
  },
  {
    href: '/resume',
    icon: FileText,
    title: '简历翻译器',
    description: '将你的经历翻译成目标岗位的语言，让HR一眼看到匹配度',
    gradient: 'from-violet-500 to-purple-600',
    shadowColor: 'shadow-violet-500/20',
    bgLight: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    href: '/interview',
    icon: MessageSquare,
    title: '模拟面试',
    description: 'AI扮演面试官，针对你的跨行背景进行真实模拟面试',
    gradient: 'from-amber-500 to-orange-500',
    shadowColor: 'shadow-amber-500/20',
    bgLight: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
];

const stats = [
  { icon: Users, label: '跨专业求职者', value: '10万+' },
  { icon: Target, label: '岗位匹配分析', value: '50万+' },
  { icon: TrendingUp, label: '成功转型率', value: '78%' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40" />
          <div className="absolute top-20 right-1/4 w-80 h-80 bg-cyan-100 rounded-full blur-3xl opacity-40" />
          <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-violet-100 rounded-full blur-3xl opacity-30" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-8 fade-in">
            <Sparkles className="w-4 h-4" />
            AI驱动的跨专业求职助手
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 fade-in">
            <span className="gradient-text">让每一次转行</span>
            <br />
            <span className="text-slate-800">都有路可循</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed fade-in">
            无论你是文科转码、工科转金融，还是任何专业的跨界求职者，
            <br className="hidden sm:block" />
            BridgePath 帮你发现隐藏的可迁移能力，规划清晰的转型路径。
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 fade-in">
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300"
            >
              开始分析
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-slate-700 font-semibold border border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-md transition-all duration-300"
            >
              配置API Key
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
            四大核心功能，助你跨界成功
          </h2>
          <p className="text-slate-500">从能力分析到面试准备，覆盖跨专业求职全流程</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.href}
                href={feature.href}
                className={`group relative p-6 rounded-2xl bg-white border border-slate-100 shadow-sm card-hover ${feature.shadowColor} hover:shadow-lg`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg ${feature.shadowColor} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-500 leading-relaxed mb-4">
                  {feature.description}
                </p>
                <div className="flex items-center gap-1 text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  立即体验
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gradient-to-b from-white to-slate-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
              三步开启跨界之旅
            </h2>
            <p className="text-slate-500">简单配置，即刻开始</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: '配置API Key', desc: '前往设置页面，输入你的AI模型API Key（支持智谱GLM、DeepSeek等）' },
              { step: '02', title: '输入背景信息', desc: '填写你的专业、课程、实习经历和目标岗位' },
              { step: '03', title: '获取分析结果', desc: 'AI为你生成能力图谱、行动路径和面试建议' },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white text-2xl font-bold mb-4 shadow-lg shadow-blue-500/20">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
