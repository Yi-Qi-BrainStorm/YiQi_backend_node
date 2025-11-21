/**
 * Configuration Initialization
 * Helper to initialize and validate configuration on startup
 */

import { getConfigService } from '../services/configService';
import { AppError } from '../types/chat';

/**
 * Initialize configuration service
 * Should be called on application startup
 */
export function initializeConfig(): void {
  try {
    console.log('🔧 Initializing configuration...');
    
    const configService = getConfigService();
    configService.loadConfig();
    
    // Display loaded configuration summary
    const supportedModels = configService.getSupportedModels();
    const rateLimits = configService.getRateLimits();
    const sessionConfig = configService.getSessionConfig();
    
    console.log('✓ Configuration loaded successfully');
    console.log(`  - Supported models: ${supportedModels.length}`);
    console.log(`  - Rate limit: ${rateLimits.requestsPerMinute} requests/minute`);
    console.log(`  - Session expiration: ${sessionConfig.expirationHours} hours`);
    console.log('');
  } catch (error) {
    console.error('❌ Failed to initialize configuration');
    if (error instanceof AppError) {
      console.error(`   Error: ${error.message}`);
    } else {
      console.error(`   Error: ${(error as Error).message}`);
    }
    console.error('');
    console.error('Please check:');
    console.error('  1. config/ai-providers.json exists and is valid JSON');
    console.error('  2. .env file exists with required API keys');
    console.error('  3. All environment variables are properly set');
    console.error('');
    throw error;
  }
}
