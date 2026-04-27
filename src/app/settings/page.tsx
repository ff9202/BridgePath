'use client';

import { useState, useEffect } from 'react';
import { Key, Save, CheckCircle, AlertCircle, Info, Eye, EyeOff } from 'lucide-react';

type Provider = 'zhipu' | 'deepseek' | 'custom';

interface Config {
  provider: Provider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

const providerInfo: Record<Provider, { name: string; description: string; defaultUrl: string; defaultModel: string; hint: string }> = {
  zhipu: {
    name: '智谱GLM',
    description: '智谱AI大模型，提供免费额度',
    defaultUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-flash',
    hint: 'glm-4-flash 为免费模型，可在 open.bigmodel.cn 注册获取API Key',
  },
  deepseek: {
    name: 'DeepSeek',
    description: 'DeepSeek大模型，性价比高',
    defaultUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    hint: '前往 platform.deepseek.com 注册获取API Key',
  },
  custom: {
    name: '自定义',
    description: '兼容OpenAI格式的自定义API',
    defaultUrl: '',
    defaultModel: '',
    hint: '填写兼容OpenAI格式的API地址和模型名称',
  },
};

export default function SettingsPage() {
  const [config, setConfig] = useState<Config>({
    provider: 'zhipu',
    apiKey: '',
    baseUrl: providerInfo.zhipu.defaultUrl,
    model: providerInfo.zhipu.defaultModel,
  });
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('bridgepath_ai_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig({
          provider: parsed.provider || 'zhipu',
          apiKey: parsed.apiKey || '',
          baseUrl: parsed.baseUrl || providerInfo[parsed.provider]?.defaultUrl || '',
          model: parsed.model || providerInfo[parsed.provider]?.defaultModel || '',
        });
      } catch {
        // ignore
      }
    }
    setLoaded(true);
  }, []);

  const handleProviderChange = (provider: Provider) => {
    setConfig({
      ...config,
      provider,
      baseUrl: providerInfo[provider].defaultUrl,
      model: providerInfo[provider].defaultModel,
    });
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('bridgepath_ai_config', JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!loaded) return null;

  const currentInfo = providerInfo[config.provider];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
            <Key className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">API Key 设置</h1>
        </div>
        <p className="text-slate-500 ml-[52px]">
          配置AI模型提供商和API Key，即可使用所有功能
        </p>
      </div>

      {/* Provider Selection */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">选择模型提供商</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.keys(providerInfo) as Provider[]).map((key) => {
            const info = providerInfo[key];
            const isSelected = config.provider === key;
            return (
              <button
                key={key}
                onClick={() => handleProviderChange(key)}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`text-sm font-semibold mb-1 ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                  {info.name}
                </div>
                <div className="text-xs text-slate-500">{info.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* API Key Input */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">API Key</h2>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={config.apiKey}
            onChange={(e) => { setConfig({ ...config, apiKey: e.target.value }); setSaved(false); }}
            placeholder="请输入你的API Key"
            className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Hint */}
        <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-600 leading-relaxed">
            {currentInfo.hint}
          </p>
        </div>

        {config.provider === 'zhipu' && !config.apiKey && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-600 leading-relaxed">
              未配置API Key时，部分功能将无法使用。建议前往智谱AI官网注册免费账号获取Key。
            </p>
          </div>
        )}
      </div>

      {/* Custom Provider Settings */}
      {config.provider === 'custom' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 fade-in">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">自定义API配置</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">API Base URL</label>
              <input
                type="text"
                value={config.baseUrl}
                onChange={(e) => { setConfig({ ...config, baseUrl: e.target.value }); setSaved(false); }}
                placeholder="https://api.example.com/v1"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">模型名称</label>
              <input
                type="text"
                value={config.model}
                onChange={(e) => { setConfig({ ...config, model: e.target.value }); setSaved(false); }}
                placeholder="gpt-3.5-turbo"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* Current Config Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">当前配置</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">提供商</span>
            <span className="text-sm font-medium text-slate-700">{currentInfo.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">模型</span>
            <span className="text-sm font-medium text-slate-700">{config.model || '未设置'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">API Key</span>
            <span className="text-sm font-medium text-slate-700">
              {config.apiKey ? `${config.apiKey.slice(0, 6)}...${config.apiKey.slice(-4)}` : '未设置'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-500">状态</span>
            <span className={`text-sm font-medium ${config.apiKey ? 'text-green-600' : 'text-amber-600'}`}>
              {config.apiKey ? '已配置' : '未配置'}
            </span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
          saved
            ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
            : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02]'
        }`}
      >
        {saved ? (
          <>
            <CheckCircle className="w-4 h-4" />
            保存成功
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            保存配置
          </>
        )}
      </button>
    </div>
  );
}
