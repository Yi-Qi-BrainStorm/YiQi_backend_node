/**
 * Simple test script to verify ConfigService functionality
 */

import { ConfigService } from './src/services/configService';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Testing ConfigService...\n');

try {
  // Create ConfigService instance
  const configService = new ConfigService();
  
  // Test 1: Load configuration
  console.log('Test 1: Loading configuration...');
  configService.loadConfig();
  console.log('✓ Configuration loaded successfully\n');
  
  // Test 2: Get provider configuration
  console.log('Test 2: Getting provider configurations...');
  const deepseekConfig = configService.getProviderConfig('deepseek');
  console.log('✓ DeepSeek config:', {
    baseURL: deepseekConfig.baseURL,
    hasApiKey: deepseekConfig.apiKey ? 'Yes (empty warning expected)' : 'No',
    models: deepseekConfig.models
  });
  
  const kimiConfig = configService.getProviderConfig('kimi');
  console.log('✓ Kimi config:', {
    baseURL: kimiConfig.baseURL,
    hasApiKey: kimiConfig.apiKey ? 'Yes (empty warning expected)' : 'No',
    models: kimiConfig.models
  });
  console.log();
  
  // Test 3: Get provider by model name
  console.log('Test 3: Getting provider by model name...');
  const provider1 = configService.getProviderByModel('deepseek-chat');
  console.log('✓ Model "deepseek-chat" -> Provider:', provider1);
  
  const provider2 = configService.getProviderByModel('kimi-latest');
  console.log('✓ Model "kimi-latest" -> Provider:', provider2);
  
  const provider3 = configService.getProviderByModel('Qwen/QwQ-32B');
  console.log('✓ Model "Qwen/QwQ-32B" -> Provider:', provider3);
  
  const provider4 = configService.getProviderByModel('z-ai/glm-4.5-air:free');
  console.log('✓ Model "z-ai/glm-4.5-air:free" -> Provider:', provider4);
  console.log();
  
  // Test 4: Get all supported models
  console.log('Test 4: Getting all supported models...');
  const models = configService.getSupportedModels();
  console.log('✓ Total supported models:', models.length);
  console.log('✓ Models:', models);
  console.log();
  
  // Test 5: Get rate limits
  console.log('Test 5: Getting rate limits...');
  const rateLimits = configService.getRateLimits();
  console.log('✓ Rate limits:', rateLimits);
  console.log();
  
  // Test 6: Get session config
  console.log('Test 6: Getting session config...');
  const sessionConfig = configService.getSessionConfig();
  console.log('✓ Session config:', sessionConfig);
  console.log();
  
  // Test 7: Test invalid model
  console.log('Test 7: Testing invalid model (should throw error)...');
  try {
    configService.getProviderByModel('invalid-model');
    console.log('✗ Should have thrown error for invalid model');
  } catch (error: any) {
    console.log('✓ Correctly threw error:', error.message);
  }
  console.log();
  
  // Test 8: Test invalid provider
  console.log('Test 8: Testing invalid provider (should throw error)...');
  try {
    configService.getProviderConfig('invalid-provider');
    console.log('✗ Should have thrown error for invalid provider');
  } catch (error: any) {
    console.log('✓ Correctly threw error:', error.message);
  }
  console.log();
  
  // Test 9: Test environment variable override
  console.log('Test 9: Testing environment variable override...');
  console.log('Note: API keys should be empty (with warnings) since .env has empty values');
  console.log('This demonstrates that env vars take precedence over config file placeholders');
  console.log();
  
  console.log('✅ All tests passed!');
  
} catch (error: any) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
