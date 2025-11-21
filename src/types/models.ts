/**
 * AI 模型类型定义
 * 基于前端 modelMapInfo 配置
 */

export enum ModelType {
  // DeepSeek 模型
  DEEPSEEK_CHAT = 'deepseek_chat',
  DEEPSEEK_REASONER = 'deepseek_reasoner',
  
  // Kimi 模型
  KIMI2 = 'kimi2',
  KIMI2_TURBO = 'kimi2_turbo',
  KIMI2_THINKING_TURBO = 'kimi2_thinking_turbo',
  KIMI_LATEST = 'kimi_latest',
  
  // Qwen 模型
  QWEN_QWQ_32B = 'Qwen_QwQ_32B',
  QWEN3_235B_A22B = 'Qwen3_235B_A22B',
  
  // 免费模型 (OpenRouter)
  FREE_GLM4_5_AIR = 'free_GLM4_5_Air',
  FREE_DEEPSEEK_R1 = 'free_deepseekR1',
  FREE_DEEPSEEK_V3 = 'free_deepseekV3',
  FREE_META_LLAMA = 'free_Meta_Llama'
}

export interface ModelInfo {
  modelName: string;      // API 调用时使用的模型名称
  modelContext: number;   // 上下文长度
  modelInfo: string;      // 模型描述信息
}

/**
 * 模型名称映射表
 * 将前端传递的模型名称映射到实际的 API 模型名称
 */
export const MODEL_NAME_MAP: Record<string, string> = {
  // DeepSeek 模型
  'deepseek-chat': 'deepseek-chat',
  'deepseek-reasoner': 'deepseek-reasoner',
  
  // Kimi 模型
  'kimi-k2-0905-preview': 'kimi-k2-0905-preview',
  'kimi-k2-turbo-preview': 'kimi-k2-turbo-preview',
  'kimi-k2-thinking-turbo': 'kimi-k2-thinking-turbo',
  'kimi-latest': 'kimi-latest',
  
  // Qwen 模型
  'Qwen/QwQ-32B': 'Qwen/QwQ-32B',
  'Qwen/Qwen3-235B-A22B-Instruct-2507': 'Qwen/Qwen3-235B-A22B-Instruct-2507',
  
  // OpenRouter 免费模型
  'z-ai/glm-4.5-air:free': 'z-ai/glm-4.5-air:free',
  'tngtech/deepseek-r1t2-chimera:free': 'tngtech/deepseek-r1t2-chimera:free',
  'deepseek/deepseek-chat-v3-0324:free': 'deepseek/deepseek-chat-v3-0324:free',
  'meta-llama/llama-3.3-70b-instruct:free': 'meta-llama/llama-3.3-70b-instruct:free'
};

/**
 * 模型到提供商的映射
 */
export const MODEL_TO_PROVIDER: Record<string, string> = {
  // DeepSeek 模型
  'deepseek-chat': 'deepseek',
  'deepseek-reasoner': 'deepseek',
  
  // Kimi 模型
  'kimi-k2-0905-preview': 'kimi',
  'kimi-k2-turbo-preview': 'kimi',
  'kimi-k2-thinking-turbo': 'kimi',
  'kimi-latest': 'kimi',
  
  // Qwen 模型
  'Qwen/QwQ-32B': 'qwen',
  'Qwen/Qwen3-235B-A22B-Instruct-2507': 'qwen',
  
  // OpenRouter 免费模型
  'z-ai/glm-4.5-air:free': 'openrouter',
  'tngtech/deepseek-r1t2-chimera:free': 'openrouter',
  'deepseek/deepseek-chat-v3-0324:free': 'openrouter',
  'meta-llama/llama-3.3-70b-instruct:free': 'openrouter'
};

/**
 * 提供商 Base URL 映射
 */
export const PROVIDER_BASE_URLS: Record<string, string> = {
  deepseek: 'https://api.deepseek.com',
  kimi: 'https://api.moonshot.cn/v1',
  qwen: 'https://api.siliconflow.cn/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1'
};
