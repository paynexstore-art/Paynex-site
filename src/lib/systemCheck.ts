/**
 * System Integrity Check
 * Validates all critical components on app startup
 */

import type { User } from '@/types';
import { getCurrentUser } from './auth';
import { getStoredUsers } from './auth';
import { isGoogleOAuthConfigured } from './googleAuth';

export interface SystemCheckResult {
  overall: 'healthy' | 'warning' | 'error';
  checks: {
    storage: CheckResult;
    auth: CheckResult;
    googleOAuth: CheckResult;
    users: CheckResult;
    performance: CheckResult;
  };
  warnings: string[];
  errors: string[];
}

interface CheckResult {
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: unknown;
}

/**
 * Run comprehensive system check
 */
export function runSystemCheck(): SystemCheckResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  const checks = {
    storage: checkLocalStorage(),
    auth: checkAuthSystem(),
    googleOAuth: checkGoogleOAuth(),
    users: checkUserData(),
    performance: checkPerformance(),
  };

  // Collect warnings and errors
  Object.values(checks).forEach(check => {
    if (check.status === 'warning') warnings.push(check.message);
    if (check.status === 'fail') errors.push(check.message);
  });

  const overall =
    errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'healthy';

  return { overall, checks, warnings, errors };
}

/**
 * Check localStorage availability and integrity
 */
function checkLocalStorage(): CheckResult {
  try {
    // Test write/read capability
    const testKey = '_system_check_test_' + Date.now();
    const testValue = 'test_' + Math.random();

    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);

    if (retrieved !== testValue) {
      return {
        status: 'fail',
        message: 'localStorage not working correctly - data mismatch',
      };
    }

    // Estimate storage usage
    const estimatedSize = estimateStorageSize();

    // Warn if storage is getting full
    if (estimatedSize > 5) {
      return {
        status: 'warning',
        message: `localStorage nearing capacity (${estimatedSize}MB / ~5MB limit)`,
        details: { storageSize: estimatedSize },
      };
    }

    return {
      status: 'pass',
      message: `localStorage OK (${estimatedSize.toFixed(2)}MB used)`,
      details: { storageSize: estimatedSize },
    };
  } catch (error) {
    return {
      status: 'fail',
      message: `localStorage unavailable: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    };
  }
}

/**
 * Check authentication system
 */
function checkAuthSystem(): CheckResult {
  try {
    const currentUser = getCurrentUser();
    const AUTH_KEY = 'paynex_auth_user';
    const hasAuthData = localStorage.getItem(AUTH_KEY) !== null;

    // Check consistency
    if (currentUser && !hasAuthData) {
      return {
        status: 'fail',
        message:
          'Auth state inconsistent - getCurrentUser() worked but no auth data in storage',
      };
    }

    if (!currentUser && hasAuthData) {
      return {
        status: 'warning',
        message:
          'Auth data exists but getCurrentUser() returned null - possible corruption',
      };
    }

    if (currentUser) {
      // Validate user structure
      const requiredFields = ['id', 'email', 'role'];
      const missingFields = requiredFields.filter(
        field => !currentUser[field as keyof User]
      );

      if (missingFields.length > 0) {
        return {
          status: 'fail',
          message: `Current user missing required fields: ${missingFields.join(', ')}`,
          details: { user: currentUser, missing: missingFields },
        };
      }

      return {
        status: 'pass',
        message: `Auth system OK (user: ${currentUser.email}, role: ${currentUser.role})`,
        details: { userId: currentUser.id, email: currentUser.email },
      };
    } else {
      return {
        status: 'pass',
        message: 'Auth system OK (no user logged in)',
      };
    }
  } catch (error) {
    return {
      status: 'fail',
      message: `Auth system check failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    };
  }
}

/**
 * Check Google OAuth configuration
 */
function checkGoogleOAuth(): CheckResult {
  try {
    const isConfigured = isGoogleOAuthConfigured();

    if (isConfigured) {
      return {
        status: 'pass',
        message: 'Google OAuth configured correctly',
      };
    } else {
      return {
        status: 'warning',
        message:
          'Google OAuth not configured (optional - set VITE_GOOGLE_CLIENT_ID in .env for OAuth login)',
      };
    }
  } catch (error) {
    return {
      status: 'warning',
      message: `Google OAuth check failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    };
  }
}

/**
 * Check user data integrity
 */
function checkUserData(): CheckResult {
  try {
    const users = getStoredUsers();

    if (!Array.isArray(users)) {
      return {
        status: 'fail',
        message: 'User data is not an array',
      };
    }

    const issues: string[] = [];

    users.forEach((user, index) => {
      if (!user || typeof user !== 'object') {
        issues.push(`User ${index} is not a valid object`);
        return;
      }

      if (!user.id) issues.push(`User ${index} missing id`);
      if (!user.email) issues.push(`User ${index} missing email`);
      if (!user.role) issues.push(`User ${index} missing role`);

      // CreatedAt is recommended but not mandatory
      if (user.createdAt && typeof user.createdAt !== 'string') {
        issues.push(`User ${index} has invalid createdAt format`);
      }
    });

    if (issues.length > 0) {
      return {
        status: 'warning',
        message: `User data has ${issues.length} issue(s)`,
        details: { issues, userCount: users.length },
      };
    }

    return {
      status: 'pass',
      message: `User data OK (${users.length} user${users.length === 1 ? '' : 's'})`,
      details: { userCount: users.length },
    };
  } catch (error) {
    return {
      status: 'fail',
      message: `User data check failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    };
  }
}

/**
 * Check performance metrics
 */
function checkPerformance(): CheckResult {
  try {
    // Use modern Performance API
    if (!window.performance || !window.performance.timing) {
      return {
        status: 'warning',
        message: 'Performance API not available - skipping performance check',
      };
    }

    const { timing } = window.performance;

    // Ensure all required values exist
    if (
      !timing.navigationStart ||
      !timing.loadEventEnd ||
      !timing.domContentLoadedEventEnd
    ) {
      return {
        status: 'warning',
        message: 'Performance timing data incomplete',
      };
    }

    const loadTime = timing.loadEventEnd - timing.navigationStart;
    const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;

    // Performance thresholds
    const SLOW_LOAD_THRESHOLD = 5000; // 5 seconds
    const VERY_SLOW_LOAD_THRESHOLD = 10000; // 10 seconds

    if (loadTime > VERY_SLOW_LOAD_THRESHOLD) {
      return {
        status: 'warning',
        message: `⚠️ App load time very slow: ${loadTime}ms (target: <3000ms)`,
        details: { loadTime, domContentLoaded },
      };
    }

    if (loadTime > SLOW_LOAD_THRESHOLD) {
      return {
        status: 'warning',
        message: `⚠️ App load time slow: ${loadTime}ms (target: <3000ms)`,
        details: { loadTime, domContentLoaded },
      };
    }

    return {
      status: 'pass',
      message: `Performance OK (load: ${loadTime}ms, DOMContentLoaded: ${domContentLoaded}ms)`,
      details: { loadTime, domContentLoaded },
    };
  } catch (error) {
    return {
      status: 'warning',
      message: `Performance check unavailable: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    };
  }
}

/**
 * Estimate localStorage usage
 */
function estimateStorageSize(): number {
  try {
    let total = 0;

    if (!window.localStorage) {
      return 0;
    }

    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        const item = localStorage.getItem(key);
        if (item) {
          total += (key.length + item.length) * 2; // Rough estimate: 2 bytes per character
        }
      }
    }

    return Math.round((total / 1024 / 1024) * 100) / 100; // Convert to MB
  } catch {
    return 0;
  }
}

/**
 * Format check results for console logging
 */
export function logSystemCheckResults(result: SystemCheckResult): void {
  const statusEmoji = {
    healthy: '✅',
    warning: '⚠️',
    error: '❌',
  };

  console.group(
    `${statusEmoji[result.overall]} System Health Check - ${result.overall.toUpperCase()}`
  );

  console.group('🔍 Detailed Checks');
  Object.entries(result.checks).forEach(([name, check]) => {
    const emoji = {
      pass: '✅',
      warning: '⚠️',
      fail: '❌',
    }[check.status];

    console.log(`${emoji} ${name}: ${check.message}`);

    if (check.details && Object.keys(check.details).length > 0) {
      console.table(check.details);
    }
  });
  console.groupEnd();

  if (result.warnings.length > 0) {
    console.group(`⚠️ Warnings (${result.warnings.length})`);
    result.warnings.forEach((w, i) => console.warn(`${i + 1}. ${w}`));
    console.groupEnd();
  }

  if (result.errors.length > 0) {
    console.group(`❌ Errors (${result.errors.length})`);
    result.errors.forEach((e, i) => console.error(`${i + 1}. ${e}`));
    console.groupEnd();
  }

  // Summary
  console.log(
    `\n📊 Summary: System is ${result.overall} - ${result.errors.length} errors, ${result.warnings.length} warnings`
  );

  console.groupEnd();
}