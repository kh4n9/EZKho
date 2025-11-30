'use client';

import { useState } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' or 'register'

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="ml-2 text-2xl font-bold text-gray-900">
                EZKho
              </span>
            </div>
          </Link>
          <p className="mt-2 text-sm text-gray-600">
            Hệ thống quản lý kho hàng chuyên nghiệp
          </p>
        </div>

        {/* Auth Form */}
        <Card>
          <CardContent className="pt-6">
            {mode === 'login' ? (
              <LoginForm onToggleMode={toggleMode} />
            ) : (
              <RegisterForm onToggleMode={toggleMode} />
            )}

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Hoặc tiếp tục với
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <GoogleLoginButton />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Bằng cách tiếp tục, bạn đồng ý với{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-500">
              Điều khoản sử dụng
            </Link>{' '}
            và{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
              Chính sách bảo mật
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}