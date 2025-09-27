import React from 'react';
import { useStore } from '../../src/store';

const LoadingBar: React.FC = () => {
    const isFetching = useStore(state => state.isFetching);

    return (
        <div className={`fixed top-0 left-0 right-0 h-1 z-[200] transition-opacity duration-300 ${isFetching ? 'opacity-100' : 'opacity-0'} pointer-events-none`}>
            <div className="h-full bg-[var(--primary)] animate-loading-bar"></div>
            <style>{`
                @keyframes loading-bar-animation {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-loading-bar {
                    width: 100%;
                    animation: loading-bar-animation 1.5s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default LoadingBar;
