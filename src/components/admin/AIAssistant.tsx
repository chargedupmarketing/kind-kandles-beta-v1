'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Trash2, 
  Settings, 
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  MessageSquare,
  Lightbulb,
  TrendingUp,
  Package,
  Users,
  ShoppingCart,
  Eye,
  EyeOff,
  Save,
  Zap,
  Brain,
  Globe
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AIConfig {
  apiKey: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI business assistant for "My Kind Kandles & Boutique", a handmade candle and skincare business. You help the store owner with:

1. **Product Descriptions**: Write compelling, SEO-friendly product descriptions for candles, body butters, room sprays, and skincare products.

2. **Marketing Content**: Create social media posts, email campaigns, and promotional content.

3. **Customer Service**: Draft professional responses to customer inquiries and reviews.

4. **Business Strategy**: Provide insights on pricing, inventory management, and seasonal promotions.

5. **Content Ideas**: Suggest blog topics, product bundles, and marketing campaigns.

Store Details:
- Location: Owings Mills, Maryland
- Products: Handmade soy candles, body butters, room sprays, bar soaps, body oils, wax melts
- Brand Voice: Warm, welcoming, emphasizing kindness and self-care
- Tagline: "Do All Things With Kindness"

Always maintain a friendly, professional tone that aligns with the brand's values of kindness, quality, and self-care.`;

const SUGGESTED_PROMPTS = [
  {
    icon: Package,
    title: 'Product Description',
    prompt: 'Write a compelling product description for a new lavender & vanilla soy candle.',
  },
  {
    icon: TrendingUp,
    title: 'Marketing Ideas',
    prompt: 'Give me 5 social media post ideas for promoting our body butter collection.',
  },
  {
    icon: Users,
    title: 'Customer Response',
    prompt: 'Help me write a professional response to a customer asking about custom candle orders.',
  },
  {
    icon: Lightbulb,
    title: 'Business Strategy',
    prompt: 'What seasonal promotions should I run for the winter holiday season?',
  },
];

const AVAILABLE_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable, best for complex tasks' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast & affordable, great for most tasks' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Powerful with large context window' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast & economical' },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [config, setConfig] = useState<AIConfig>({
    apiKey: '',
    model: 'gpt-4o-mini',
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    temperature: 0.7,
    maxTokens: 2000,
  });

  // Load config and messages from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('ai_assistant_config');
    const savedMessages = localStorage.getItem('ai_assistant_messages');
    
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error('Error loading AI config:', e);
      }
    }
    
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((m: Message) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
      } catch (e) {
        console.error('Error loading messages:', e);
      }
    }
  }, []);

  // Save config to localStorage
  const saveConfig = () => {
    localStorage.setItem('ai_assistant_config', JSON.stringify(config));
    setShowSettings(false);
  };

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ai_assistant_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    if (!config.apiKey) {
      setError('Please configure your OpenAI API key in settings.');
      setShowSettings(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          config: {
            apiKey: config.apiKey,
            model: config.model,
            systemPrompt: config.systemPrompt,
            temperature: config.temperature,
            maxTokens: config.maxTokens,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('AI Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response from AI');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearConversation = () => {
    if (confirm('Are you sure you want to clear the conversation history?')) {
      setMessages([]);
      localStorage.removeItem('ai_assistant_messages');
    }
  };

  const scanWebsite = async () => {
    setIsLoading(true);
    setError(null);
    
    const scanMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: 'Please scan and analyze the website to understand the business better. Provide a summary of what you find.',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, scanMessage]);

    try {
      const response = await fetch('/api/admin/ai/scan-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: config.apiKey,
          model: config.model,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to scan website');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Website scan error:', err);
      setError(err instanceof Error ? err.message : 'Failed to scan website');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex-shrink-0">
            <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100">AI Assistant</h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm truncate">OpenAI • {config.model}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:mx-0 sm:px-0">
          <button
            onClick={scanWebsite}
            disabled={isLoading || !config.apiKey}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg disabled:opacity-50 transition-colors text-xs sm:text-sm whitespace-nowrap"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Scan Website</span>
            <span className="sm:hidden">Scan</span>
          </button>
          <button
            onClick={clearConversation}
            disabled={messages.length === 0}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 disabled:opacity-50 text-xs sm:text-sm whitespace-nowrap"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Clear</span>
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap ${
              showSettings 
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <h3 className="font-bold text-base sm:text-lg mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Configuration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* API Key */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">OpenAI API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-12 sm:pr-20 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:border-slate-600 font-mono text-xs sm:text-sm"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">OpenAI Dashboard</a>
              </p>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Model</label>
              <select
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:border-slate-600 text-sm"
              >
                {AVAILABLE_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} - {model.description}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Recommended: GPT-4o Mini for best balance
              </p>
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Temperature: {config.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                className="w-full h-2"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Focused</span>
                <span>Creative</span>
              </div>
            </div>

            {/* System Prompt */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">System Prompt (Training)</label>
              <textarea
                value={config.systemPrompt}
                onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                rows={4}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:border-slate-600 text-sm"
                placeholder="Describe how the AI should behave..."
              />
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-2">
                <p className="text-xs text-slate-500">
                  This prompt trains the AI about your business
                </p>
                <button
                  onClick={() => setConfig({ ...config, systemPrompt: DEFAULT_SYSTEM_PROMPT })}
                  className="text-xs text-purple-600 hover:text-purple-700"
                >
                  Reset to Default
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4 sm:mt-6 pt-4 border-t dark:border-slate-700">
            <button
              onClick={saveConfig}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg transition-colors text-sm"
            >
              <Save className="h-4 w-4" />
              Save Configuration
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-8">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full mb-3 sm:mb-4">
                <Sparkles className="h-8 w-8 sm:h-12 sm:w-12 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
                How can I help you today?
              </h3>
              <p className="text-slate-500 mb-4 sm:mb-6 max-w-md text-sm sm:text-base">
                I'm your AI business assistant. Ask me about product descriptions, marketing ideas, 
                customer service, or business strategy.
              </p>
              
              {/* Suggested Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full max-w-2xl">
                {SUGGESTED_PROMPTS.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(suggestion.prompt)}
                    disabled={!config.apiKey}
                    className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 active:bg-slate-200 dark:active:bg-slate-500 rounded-lg text-left transition-colors disabled:opacity-50"
                  >
                    <suggestion.icon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white text-xs sm:text-sm">{suggestion.title}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{suggestion.prompt}</p>
                    </div>
                  </button>
                ))}
              </div>
              
              {!config.apiKey && (
                <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ Configure your OpenAI API key in settings to get started
                </p>
              )}
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1.5 sm:mb-2 pb-1.5 sm:pb-2 border-b border-slate-200 dark:border-slate-600">
                      <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500" />
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400">AI Assistant</span>
                    </div>
                  )}
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === 'assistant' && (
                    <div className="flex items-center justify-end gap-2 mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-200 dark:border-slate-600">
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 active:text-slate-800"
                        title="Copy response"
                      >
                        {copiedId === message.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl px-3 sm:px-4 py-2 sm:py-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-purple-500" />
                  <span className="text-xs sm:text-sm text-slate-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 sm:p-4 border-t dark:border-slate-700">
          <div className="flex items-center gap-2 sm:gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={config.apiKey ? "Ask me anything..." : "Configure API key..."}
              disabled={!config.apiKey || isLoading}
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:border-slate-600 disabled:opacity-50 text-sm sm:text-base"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading || !config.apiKey}
              className="p-2.5 sm:p-3 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

