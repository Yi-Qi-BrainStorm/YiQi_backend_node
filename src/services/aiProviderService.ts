/**
 * AI Provider Service
 * Manages multiple AI providers and routes requests to the appropriate provider
 */

import { AIProvider, ChatMessage, AgentConfig, ErrorCode, AppError } from '../types/chat';
import { getConfigService } from './configService';

/**
 * Base class for OpenAI-compatible providers
 */
abstract class OpenAICompatibleProvider implements AIProvider {
  constructor(
    protected baseURL: string,
    protected apiKey: string,
    protected providerName: string
  ) {}

  /**
   * Non-stream chat completion
   */
  async chat(messages: ChatMessage[], config: AgentConfig): Promise<string> {
    try {
      // Handle baseURL that may or may not include /chat/completions
      const url = this.baseURL.includes('/chat/completions') 
        ? this.baseURL 
        : `${this.baseURL}/chat/completions`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          temperature: config.temperature,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new AppError(
          ErrorCode.AI_API_ERROR,
          `${this.providerName} API error: ${response.status} - ${errorText}`,
          500
        );
      }

      const data = await response.json() as any;
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new AppError(
          ErrorCode.AI_API_ERROR,
          `Invalid response from ${this.providerName} API`,
          500
        );
      }

      return data.choices[0].message.content as string;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        ErrorCode.AI_API_ERROR,
        `Failed to call ${this.providerName} API: ${(error as Error).message}`,
        500
      );
    }
  }

  /**
   * Stream chat completion
   */
  async chatStream(
    messages: ChatMessage[],
    config: AgentConfig,
    onChunk: (text: string) => void
  ): Promise<void> {
    try {
      // Handle baseURL that may or may not include /chat/completions
      const url = this.baseURL.includes('/chat/completions') 
        ? this.baseURL 
        : `${this.baseURL}/chat/completions`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          temperature: config.temperature,
          stream: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new AppError(
          ErrorCode.AI_API_ERROR,
          `${this.providerName} API error: ${response.status} - ${errorText}`,
          500
        );
      }

      if (!response.body) {
        throw new AppError(
          ErrorCode.AI_API_ERROR,
          `No response body from ${this.providerName} API`,
          500
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
          
          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.slice(6);
              const data = JSON.parse(jsonStr) as any;
              
              if (data.choices && data.choices[0] && data.choices[0].delta) {
                const content = data.choices[0].delta.content;
                if (content) {
                  onChunk(content as string);
                }
              }
            } catch (parseError) {
              console.error(`Failed to parse SSE chunk: ${trimmedLine}`, parseError);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        ErrorCode.AI_API_ERROR,
        `Failed to stream from ${this.providerName} API: ${(error as Error).message}`,
        500
      );
    }
  }
}

/**
 * DeepSeek Provider
 */
class DeepSeekProvider extends OpenAICompatibleProvider {
  constructor(baseURL: string, apiKey: string) {
    super(baseURL, apiKey, 'DeepSeek');
  }
}

/**
 * Kimi Provider
 */
class KimiProvider extends OpenAICompatibleProvider {
  constructor(baseURL: string, apiKey: string) {
    super(baseURL, apiKey, 'Kimi');
  }
}

/**
 * Qwen Provider (via SiliconFlow)
 */
class QwenProvider extends OpenAICompatibleProvider {
  constructor(baseURL: string, apiKey: string) {
    super(baseURL, apiKey, 'Qwen');
  }
}

/**
 * OpenRouter Provider
 */
class OpenRouterProvider extends OpenAICompatibleProvider {
  constructor(baseURL: string, apiKey: string) {
    super(baseURL, apiKey, 'OpenRouter');
  }
}

/**
 * AI Provider Service
 * Manages provider instances and routes requests
 */
export class AIProviderService {
  private providers: Map<string, AIProvider> = new Map();
  private modelToProvider: Map<string, string> = new Map();

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize all providers from configuration
   */
  private initializeProviders(): void {
    const configService = getConfigService();
    const config = configService.getFullConfig();

    for (const [providerName, providerConfig] of Object.entries(config.providers)) {
      // Create provider instance
      let provider: AIProvider;

      switch (providerName.toLowerCase()) {
        case 'deepseek':
          provider = new DeepSeekProvider(providerConfig.baseURL, providerConfig.apiKey);
          break;
        case 'kimi':
          provider = new KimiProvider(providerConfig.baseURL, providerConfig.apiKey);
          break;
        case 'qwen':
          provider = new QwenProvider(providerConfig.baseURL, providerConfig.apiKey);
          break;
        case 'openrouter':
          provider = new OpenRouterProvider(providerConfig.baseURL, providerConfig.apiKey);
          break;
        default:
          console.warn(`Unknown provider: ${providerName}, skipping initialization`);
          continue;
      }

      // Register provider
      this.providers.set(providerName, provider);

      // Map models to provider
      for (const model of providerConfig.models) {
        this.modelToProvider.set(model, providerName);
      }
    }

    console.log(`✓ Initialized ${this.providers.size} AI providers`);
  }

  /**
   * Get provider by model name
   */
  public getProvider(modelName: string): AIProvider {
    const providerName = this.modelToProvider.get(modelName);
    
    if (!providerName) {
      throw new AppError(
        ErrorCode.INVALID_MODEL,
        `Model ${modelName} is not supported`,
        400
      );
    }

    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new AppError(
        ErrorCode.CONFIG_MISSING,
        `Provider ${providerName} is not initialized`,
        500
      );
    }

    return provider;
  }

  /**
   * Register a custom provider
   */
  public registerProvider(providerName: string, provider: AIProvider, models: string[]): void {
    this.providers.set(providerName, provider);
    
    for (const model of models) {
      this.modelToProvider.set(model, providerName);
    }
  }

  /**
   * Get all supported models
   */
  public getSupportedModels(): string[] {
    return Array.from(this.modelToProvider.keys());
  }

  /**
   * Check if a model is supported
   */
  public isModelSupported(modelName: string): boolean {
    return this.modelToProvider.has(modelName);
  }
}

// Singleton instance
let aiProviderServiceInstance: AIProviderService | null = null;

/**
 * Get singleton instance of AIProviderService
 */
export function getAIProviderService(): AIProviderService {
  if (!aiProviderServiceInstance) {
    aiProviderServiceInstance = new AIProviderService();
  }
  return aiProviderServiceInstance;
}
