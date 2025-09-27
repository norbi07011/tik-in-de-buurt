import React from 'react';

const ReviewSkeleton: React.FC = () => {
    return (
        <div className="bg-[var(--background-alt)] p-4 rounded-lg border border-[var(--border-color-alt)] flex gap-4 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-[var(--border-color)]"></div>
            <div className="flex-grow">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-5 w-24 bg-[var(--border-color)] rounded mb-1.5"></div>
                        <div className="h-3 w-16 bg-[var(--border-color)] rounded"></div>
                    </div>
                     <div className="h-5 w-28 bg-[var(--border-color)] rounded"></div>
                </div>
                <div className="h-4 w-full bg-[var(--border-color)] rounded mt-3"></div>
                <div className="h-4 w-3/4 bg-[var(--border-color)] rounded mt-2"></div>
            </div>
        </div>
    );
};

export default ReviewSkeleton;
