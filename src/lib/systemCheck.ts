/**
 * System Integrity Check
 * Validates all critical components on app startup
 */

import type { User, SiteSettings } from '@/types';
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
  details?: any;
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

  const overall = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'healthy';

  return { overall, checks, warnings, errors };
}

/**
 * Check localStorage availability and integrity
 */
function checkLocalStorage(): CheckResult {
  try {
    const testKey = '_system_check_test_' + Date.now();
    const testValue = 'test_' + Math.random();
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);

    if (retrieved !== testValue) {
      return {
        status: 'fail',
        message: 'localStorage not working correctly',
      };
    }

    const estimatedSize = estimateStorageSize();
    return {
      status: 'pass',
      message: `localStorage OK (est. ${estimatedSize}MB used)`,
      details: { storageSize: estimatedSize },
    };
  } catch (error) {
    return {
      status: 'fail',
      message: 'localStorage unavailable: ' + (error instanceof Error ? error.message : 'Unknown error'),
    };
  }
}

/**
 * Check authentication system
 */
function checkAuthSystem(): CheckResult {
  try {
    const currentUser = getCurrentUser();
    const authKey = 'qastly_auth_user';
    const hasAuthData = localStorage.getItem(authKey) !== null;

    if (currentUser && !hasAuthData) {
      return {
        status: 'fail',
        message: 'Auth state inconsistent (getCurrentUser worked but no auth data)',
      };
    }

    if (currentUser) {
      // Validate user structure
      if (!currentUser.id || !currentUser.email || !currentUser.role) {
        return {
          status: 'fail',
          message: 'Current user has invalid structure',
          details: currentUser,
        };
      }
      return {
        status: 'pass',
        message: `Auth system OK (user: ${currentUser.email})`,
        details: { loggedInUser: currentUser.name },
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
      message: 'Auth system check failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
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
        message: 'Google OAuth not configured (set VITE_GOOGLE_CLIENT_ID in .env)',
      };
    }
  } catch (error) {
    return {
      status: 'fail',
      message: 'Google OAuth check failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
    };
  }
}

/**
 * Check user data integrity
 */
function checkUserData(): CheckResult {
  try {
    const users = getStoredUsers();
    const issues: string[] = [];

    users.forEach((user, index) => {
      if (!user.id) issues.push(`User ${index} missing id`);
      if (!user.email) issues.push(`User ${index} missing email`);
      if (!user.role) issues.push(`User ${index} missing role`);
      if (!user.createdAt) issues.push(`User ${index} missing createdAt`);
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
      message: `User data OK (${users.length} users)`,
      details: { userCount: users.length },
    };
  } catch (error) {
    return {
      status: 'fail',
      message: 'User data check failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
    };
  }
}

/**
 * Check performance metrics
 */
function checkPerformance(): CheckResult {
  try {
    const navigationTiming = (window as any).performance?.timing;
    if (!navigationTiming) {
      return {
        status: 'warning',
        message: 'Performance API not available',
      };
    }

    const loadTime = navigationTiming.loadEventEnd - navigationTiming.navigationStart;
    const domContentLoaded = navigationTiming.domContentLoadedEventEnd - navigationTiming.navigationStart;

    if (loadTime > 5000) {
      return {
        status: 'warning',
        message: `App load time slow: ${loadTime}ms`,
        details: { loadTime, domContentLoaded },
      };
    }

    return {
      status: 'pass',
      message: `Performance OK (load: ${loadTime}ms)`,
      details: { loadTime, domContentLoaded },
    };
  } catch (error) {
    return {
      status: 'warning',
      message: 'Performance check unavailable',
    };
  }
}

/**
 * Estimate localStorage usage
 */
function estimateStorageSize(): number {
  try {
    let total = 0;
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return Math.round(total / 1024 / 1024 * 100) / 100; // MB
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

  console.group(`${statusEmoji[result.overall]} System Health Check - ${result.overall.toUpperCase()}`);

  console.group('Detailed Checks');
  Object.entries(result.checks).forEach(([name, check]) => {
    const emoji = {
      pass: '✅',
      warning: '⚠️',
      fail: '❌',
    }[check.status];
    console.log(`${emoji} ${name}: ${check.message}`);
    if (check.details) {
      console.table(check.details);
    }
  });
  console.groupEnd();

  if (result.warnings.length > 0) {
    console.group('Warnings');
    result.warnings.forEach(w => console.warn(w));
    console.groupEnd();
  }

  if (result.errors.length > 0) {
    console.group('Errors');
    result.errors.forEach(e => console.error(e));
    console.groupEnd();
  }

  console.groupEnd();
}
