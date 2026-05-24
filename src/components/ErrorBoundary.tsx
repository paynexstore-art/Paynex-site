import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree.
 * Prevents white screen of death.
 * Logs error information and displays fallback UI.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔴 Error Boundary Caught:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-800 mb-2">حدث خطأ!</h1>
            <p className="text-red-600 mb-6 text-sm">
              {this.state.error?.message || 'حدث خطأ غير متوقع. يرجى محاولة إعادة تحميل الصفحة.'}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.location.href = '/'}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                العودة للرئيسية
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold transition"
              >
                إعادة تحميل
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
