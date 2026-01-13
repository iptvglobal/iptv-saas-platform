/**
 * Email Diagnostic Utility
 * 
 * This module provides diagnostic functions to test and troubleshoot
 * the Brevo email service configuration.
 */

import * as brevo from '@getbrevo/brevo';

interface DiagnosticResult {
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

interface FullDiagnosticReport {
  timestamp: string;
  environment: {
    brevoApiKey: DiagnosticResult;
    brevoSenderEmail: DiagnosticResult;
    brevoSenderName: DiagnosticResult;
    adminNotificationEmail: DiagnosticResult;
    appUrl: DiagnosticResult;
  };
  apiConnection: DiagnosticResult;
  recommendations: string[];
}

/**
 * Check if a required environment variable is set
 */
function checkEnvVar(name: string, value: string | undefined, required: boolean = true): DiagnosticResult {
  if (!value) {
    return {
      status: required ? 'error' : 'warning',
      message: `${name} is not set`,
      details: { required }
    };
  }
  
  // Mask sensitive values
  const maskedValue = name.includes('KEY') || name.includes('SECRET') 
    ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
    : value;
    
  return {
    status: 'success',
    message: `${name} is configured`,
    details: { value: maskedValue }
  };
}

/**
 * Test the Brevo API connection
 */
async function testBrevoConnection(): Promise<DiagnosticResult> {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    return {
      status: 'error',
      message: 'Cannot test API connection - BREVO_API_KEY not set'
    };
  }
  
  try {
    const apiInstance = new brevo.AccountApi();
    apiInstance.setApiKey(brevo.AccountApiApiKeys.apiKey, apiKey);
    
    const account = await apiInstance.getAccount();
    
    return {
      status: 'success',
      message: 'Successfully connected to Brevo API',
      details: {
        email: (account as any)?.email,
        companyName: (account as any)?.companyName,
        plan: (account as any)?.plan?.[0]?.type
      }
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: 'Failed to connect to Brevo API',
      details: {
        error: error?.message || 'Unknown error',
        statusCode: error?.response?.status
      }
    };
  }
}

/**
 * Run a full diagnostic check on the email system
 */
export async function runEmailDiagnostic(): Promise<FullDiagnosticReport> {
  const recommendations: string[] = [];
  
  // Check environment variables
  const brevoApiKeyResult = checkEnvVar('BREVO_API_KEY', process.env.BREVO_API_KEY);
  const brevoSenderEmailResult = checkEnvVar('BREVO_SENDER_EMAIL', process.env.BREVO_SENDER_EMAIL);
  const brevoSenderNameResult = checkEnvVar('BREVO_SENDER_NAME', process.env.BREVO_SENDER_NAME, false);
  const adminEmailResult = checkEnvVar('ADMIN_NOTIFICATION_EMAIL', process.env.ADMIN_NOTIFICATION_EMAIL, false);
  const appUrlResult = checkEnvVar('APP_URL', process.env.APP_URL || process.env.VITE_APP_URL, false);
  
  // Generate recommendations
  if (brevoApiKeyResult.status === 'error') {
    recommendations.push('Set BREVO_API_KEY environment variable with your Brevo API key');
  }
  if (brevoSenderEmailResult.status === 'error') {
    recommendations.push('Set BREVO_SENDER_EMAIL environment variable with a verified sender email');
  }
  if (adminEmailResult.status === 'warning') {
    recommendations.push('Set ADMIN_NOTIFICATION_EMAIL to receive notifications for new orders');
  }
  if (appUrlResult.status === 'warning') {
    recommendations.push('Set APP_URL or VITE_APP_URL for correct email links');
  }
  
  // Test API connection
  const apiConnectionResult = await testBrevoConnection();
  if (apiConnectionResult.status === 'error') {
    recommendations.push('Verify your BREVO_API_KEY is correct and the account is active');
  }
  
  return {
    timestamp: new Date().toISOString(),
    environment: {
      brevoApiKey: brevoApiKeyResult,
      brevoSenderEmail: brevoSenderEmailResult,
      brevoSenderName: brevoSenderNameResult,
      adminNotificationEmail: adminEmailResult,
      appUrl: appUrlResult
    },
    apiConnection: apiConnectionResult,
    recommendations
  };
}

/**
 * Print diagnostic report to console
 */
export async function printEmailDiagnostic(): Promise<void> {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           EMAIL SYSTEM DIAGNOSTIC REPORT                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  
  const report = await runEmailDiagnostic();
  
  console.log(`📅 Timestamp: ${report.timestamp}`);
  console.log('');
  
  console.log('📋 ENVIRONMENT VARIABLES:');
  console.log('─────────────────────────────────────────────────────────────');
  
  const envChecks = Object.entries(report.environment);
  for (const [key, result] of envChecks) {
    const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    console.log(`  ${icon} ${result.message}`);
    if (result.details?.value) {
      console.log(`     Value: ${result.details.value}`);
    }
  }
  
  console.log('');
  console.log('🔌 API CONNECTION:');
  console.log('─────────────────────────────────────────────────────────────');
  const apiIcon = report.apiConnection.status === 'success' ? '✅' : '❌';
  console.log(`  ${apiIcon} ${report.apiConnection.message}`);
  if (report.apiConnection.details) {
    if (report.apiConnection.details.email) {
      console.log(`     Account: ${report.apiConnection.details.email}`);
    }
    if (report.apiConnection.details.error) {
      console.log(`     Error: ${report.apiConnection.details.error}`);
    }
  }
  
  if (report.recommendations.length > 0) {
    console.log('');
    console.log('💡 RECOMMENDATIONS:');
    console.log('─────────────────────────────────────────────────────────────');
    report.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
  }
  
  console.log('');
  console.log('═════════════════════════════════════════════════════════════');
  console.log('');
}

/**
 * Export for use in API endpoints
 */
export { DiagnosticResult, FullDiagnosticReport };
