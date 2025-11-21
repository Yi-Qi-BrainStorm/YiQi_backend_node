/**
 * Configuration Service
 * Loads and manages AI provider configurations with environment variable support
 */

import * as fs from 'fs';
import * as path from 'path';
import { ProvidersConfig, ProviderConfig, ErrorCode, AppError } from '../types/chat';

export class ConfigService {
  private config: ProvidersConfig | null = null;
  private configPath: string;

  constructor(configPath: string = 'config/ai-providers.json') {
    this.configPath = configPath;
  }

  /**
   * Load configuration from file and apply environment variable overrides
   */
  public loadConfig(): void {
    try {
      // Read config file
      const configFilePath = path.resolve(process.cwd(), this.configPath);
      
      if (!fs.existsSync(configFilePath)) {
        throw new AppError(
          ErrorCode.CONFIG_MISSING,
          `Configuration file not found: ${configFilePath}`,
          500
        );
      }

      const configContent = fs.readFileSync(configFilePath, 'utf-8');
      const rawConfig = JSON.parse(configContent) as ProvidersConfig;

      // Apply environment variable overrides
      this.config = this.applyEnvironmentOverrides(rawConfig);

      // Validate configuration
      this.validateConfig();

      console.log('✓ Configuration loaded successfully');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        ErrorCode.CONFIG_MISSING,
        `Failed to load configuration: ${(error as Error).message}`,
        500
      );
    }
  }

  /**
   * Apply environment variable overrides to configuration
   * Environment variables take precedence over config file values
   */
  private applyEnvironmentOverrides(config: ProvidersConfig): ProvidersConfig {
    const overriddenConfig = JSON.parse(JSON.stringify(config)) as ProvidersConfig;

    // Override API keys from environment variables
    for (const [providerName, providerConfig] of Object.entries(overriddenConfig.providers)) {
      // Replace ${ENV_VAR} placeholders with actual environment variable values
      const apiKeyMatch = providerConfig.apiKey.match(/\$\{(.+)\}/);
      if (apiKeyMatch) {
        const envVarName = apiKeyMatch[1];
        const envValue = process.env[envVarName];
        
        if (envValue) {
          providerConfig.apiKey = envValue;
        } else {
          console.warn(`⚠ Warning: Environment variable ${envVarName} for provider ${providerName} is not set`);
          providerConfig.apiKey = ''; // Set to empty string if not found
        }
      }

      // Allow direct environment variable override (e.g., DEEPSEEK_API_KEY)
      const directEnvKey = `${providerName.toUpperCase()}_API_KEY`;
      if (process.env[directEnvKey]) {
        providerConfig.apiKey = process.env[directEnvKey]!;
      }
    }

    return overriddenConfig;
  }

  /**
   * Validate configuration structure and required fields
   */
  private validateConfig(): void {
    if (!this.config) {
      throw new AppError(
        ErrorCode.CONFIG_MISSING,
        'Configuration is not loaded',
        500
      );
    }

    // Validate providers exist
    if (!this.config.providers || Object.keys(this.config.providers).length === 0) {
      throw new AppError(
        ErrorCode.CONFIG_MISSING,
        'No providers configured',
        500
      );
    }

    // Validate each provider
    for (const [providerName, providerConfig] of Object.entries(this.config.providers)) {
      if (!providerConfig.baseURL) {
        throw new AppError(
          ErrorCode.CONFIG_MISSING,
          `Provider ${providerName} is missing baseURL`,
          500
        );
      }

      if (!providerConfig.models || providerConfig.models.length === 0) {
        throw new AppError(
          ErrorCode.CONFIG_MISSING,
          `Provider ${providerName} has no models configured`,
          500
        );
      }

      // Warn if API key is missing but don't fail
      if (!providerConfig.apiKey) {
        console.warn(`⚠ Warning: Provider ${providerName} has no API key configured`);
      }
    }

    // Validate rate limits
    if (!this.config.rateLimits) {
      throw new AppError(
        ErrorCode.CONFIG_MISSING,
        'Rate limits configuration is missing',
        500
      );
    }

    // Validate session config
    if (!this.config.session) {
      throw new AppError(
        ErrorCode.CONFIG_MISSING,
        'Session configuration is missing',
        500
      );
    }
  }

  /**
   * Get provider configuration by provider name
   */
  public getProviderConfig(providerName: string): ProviderConfig {
    if (!this.config) {
      throw new AppError(
        ErrorCode.CONFIG_MISSING,
        'Configuration is not loaded',
        500
      );
    }

    const providerConfig = this.config.providers[providerName];
    if (!providerConfig) {
      throw new AppError(
        ErrorCode.INVALID_CONFIG,
        `Provider ${providerName} not found in configuration`,
        400
      );
    }

    return providerConfig;
  }

  /**
   * Get provider name by model name
   */
  public getProviderByModel(modelName: string): string {
    if (!this.config) {
      throw new AppError(
        ErrorCode.CONFIG_MISSING,
        'Configuration is not loaded',
        500
      );
    }

    for (const [providerName, providerConfig] of Object.entries(this.config.providers)) {
      if (providerConfig.models.includes(modelName)) {
        return providerName;
      }
    }

    throw new AppError(
      ErrorCode.INVALID_MODEL,
      `Model ${modelName} is not supported`,
      400
    );
  }

  /**
   * Get all supported models
   */
  public getSupportedModels(): string[] {
    if (!this.config) {
      throw new AppError(
        ErrorCode.CONFIG_MISSING,
        'Configuration is not loaded',
        500
      );
    }

    const models: string[] = [];
    for (const providerConfig of Object.values(this.config.providers)) {
      models.push(...providerConfig.models);
    }

    return models;
  }

  /**
   * Get rate limit configuration
   */
  public getRateLimits() {
    if (!this.config) {
      throw new AppError(
        ErrorCode.CONFIG_MISSING,
        'Configuration is not loaded',
        500
      );
    }

    return this.config.rateLimits;
  }

  /**
   * Get session configuration
   */
  public getSessionConfig() {
    if (!this.config) {
      throw new AppError(
        ErrorCode.CONFIG_MISSING,
        'Configuration is not loaded',
        500
      );
    }

    return this.config.session;
  }

  /**
   * Get full configuration (for debugging)
   */
  public getFullConfig(): ProvidersConfig {
    if (!this.config) {
      throw new AppError(
        ErrorCode.CONFIG_MISSING,
        'Configuration is not loaded',
        500
      );
    }

    return this.config;
  }
}

// Singleton instance
let configServiceInstance: ConfigService | null = null;

/**
 * Get singleton instance of ConfigService
 */
export function getConfigService(): ConfigService {
  if (!configServiceInstance) {
    configServiceInstance = new ConfigService();
  }
  return configServiceInstance;
}
