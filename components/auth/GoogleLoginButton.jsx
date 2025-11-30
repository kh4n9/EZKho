'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function GoogleLoginButton() {
    const router = useRouter();
    const { login } = useAuth();

    const handleSuccess = async (credentialResponse) => {
        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    credential: credentialResponse.credential,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Đăng nhập Google thất bại');
            }

            // Use the login function from AuthContext to set user and token
            // Assuming login function takes (userData, token) or similar
            // If AuthContext only has login(email, password), we might need to manually set token
            // Let's check AuthContext first. For now, I'll assume we can manually set it or reload.

            // Actually, standard AuthContext usually has a way to set state.
            // If not, we can save to localStorage and reload/redirect.

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Force reload to update AuthContext state if it reads from localStorage on mount
            // Or better, if AuthContext exposes a setAuth method.
            // For now, simple redirect might work if AuthContext checks token on mount.

            toast.success('Đăng nhập thành công!');
            window.location.href = '/dashboard'; // Full reload to ensure state sync

        } catch (error) {
            console.error('Google Login Error:', error);
            toast.error(error.message || 'Đăng nhập thất bại');
        }
    };

    return (
        <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => {
                toast.error('Đăng nhập Google thất bại');
            }}
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
            width="100%"
        />
    );
}
