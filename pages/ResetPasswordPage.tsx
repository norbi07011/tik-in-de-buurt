import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../src/store';
import { api } from '../src/api';
import { Page } from '../src/types';
import { LockClosedIcon, CheckCircleIcon, XMarkIcon } from '../components/icons/Icons';

const ResetPasswordPage: React.FC = () => {
    const { t } = useTranslation();
    const { navigate, showToast } = useStore();
    const [token, setToken] = useState<string>('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);
    const [isTokenValid, setIsTokenValid] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        // Get token from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const resetToken = urlParams.get('token');
        
        if (!resetToken) {
            showToast('Invalid reset link', 'error');
            navigate(Page.Auth);
            return;
        }

        setToken(resetToken);
        verifyToken(resetToken);
    }, []);

    const verifyToken = async (resetToken: string) => {
        try {
            const response = await api.verifyResetToken(resetToken);
            setIsTokenValid(true);
            setUserEmail(response.email || '');
        } catch (error: any) {
            setIsTokenValid(false);
            showToast(error.message || 'Invalid or expired reset token', 'error');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showToast('Password must be at least 6 characters long', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.resetPassword(token, newPassword);
            setIsSuccess(true);
            showToast(response.message, 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to reset password', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isVerifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">{t('verifying_reset_token') || 'Verifying reset token...'}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isTokenValid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 text-center">
                    <XMarkIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        {t('invalid_reset_link') || 'Invalid Reset Link'}
                    </h1>
                    <p className="text-gray-600 mb-6">
                        {t('reset_link_expired') || 'This reset link is invalid or has expired. Please request a new one.'}
                    </p>
                    <button 
                        onClick={() => navigate(Page.Auth)}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        {t('back_to_login') || 'Back to Login'}
                    </button>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 text-center">
                    <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        {t('password_reset_success') || 'Password Reset Successful'}
                    </h1>
                    <p className="text-gray-600 mb-6">
                        {t('password_reset_success_message') || 'Your password has been successfully reset. You can now log in with your new password.'}
                    </p>
                    <button 
                        onClick={() => navigate(Page.Auth)}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        {t('login_now') || 'Login Now'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
                <div className="text-center mb-8">
                    <LockClosedIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900">
                        {t('reset_your_password') || 'Reset Your Password'}
                    </h1>
                    {userEmail && (
                        <p className="text-sm text-gray-600 mt-2">
                            {t('resetting_password_for') || 'Resetting password for'}: <strong>{userEmail}</strong>
                        </p>
                    )}
                </div>

                <form onSubmit={handleResetPassword} className="space-y-6">
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('new_password') || 'New Password'}
                        </label>
                        <div className="relative">
                            <input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-12"
                                placeholder={t('enter_new_password') || 'Enter your new password'}
                            />
                            <LockClosedIcon className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('confirm_password') || 'Confirm Password'}
                        </label>
                        <div className="relative">
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-12"
                                placeholder={t('confirm_new_password') || 'Confirm your new password'}
                            />
                            <LockClosedIcon className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                        </div>
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                            {t('password_requirements') || 'Password Requirements:'}
                        </h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li className={`flex items-center ${newPassword.length >= 6 ? 'text-green-600' : ''}`}>
                                <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                                {t('minimum_6_characters') || 'At least 6 characters'}
                            </li>
                            <li className={`flex items-center ${newPassword === confirmPassword && newPassword ? 'text-green-600' : ''}`}>
                                <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                                {t('passwords_must_match') || 'Passwords must match'}
                            </li>
                        </ul>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                {t('resetting_password') || 'Resetting Password...'}
                            </span>
                        ) : (
                            t('reset_password') || 'Reset Password'
                        )}
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => navigate(Page.Auth)}
                            className="text-sm text-blue-600 hover:text-blue-700 underline"
                        >
                            {t('back_to_login') || 'Back to Login'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;