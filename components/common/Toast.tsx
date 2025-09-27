import React, { useEffect } from 'react';
import { useStore } from '../../src/store';
import { CheckCircleIcon, XCircleIcon } from '../icons/Icons';

const Toast: React.FC = () => {
    const { toast, hideToast } = useStore(state => ({ toast: state.toast, hideToast: state.hideToast }));

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => {
                hideToast();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [toast, hideToast]);

    if (!toast) return null;

    const isSuccess = toast.type === 'success';

    return (
        <div 
            className={`fixed bottom-5 right-5 z-[200] flex items-center gap-4 px-6 py-3 rounded-lg shadow-2xl transition-all duration-500 animate-slide-in-up
                ${isSuccess ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
        >
            {isSuccess ? <CheckCircleIcon className="w-6 h-6" /> : <XCircleIcon className="w-6 h-6" />}
            <span className="font-semibold">{toast.message}</span>
            <style>{`
                @keyframes slide-in-up {
                    from { transform: translateY(100px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-in-up {
                    animation: slide-in-up 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                }
            `}</style>
        </div>
    );
};

export default Toast;
