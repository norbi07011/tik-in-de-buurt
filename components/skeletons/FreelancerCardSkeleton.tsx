import React from 'react';

const FreelancerCardSkeleton: React.FC = () => {
    return (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg overflow-hidden animate-pulse text-center">
             <div className="relative pt-16">
                 <div className="w-24 h-24 rounded-full bg-[var(--border-color-alt)] mx-auto"></div>
            </div>
            <div className="p-4">
                <div className="h-6 w-3/4 bg-[var(--border-color-alt)] rounded mx-auto mb-2"></div>
                <div className="h-4 w-1/2 bg-[var(--border-color-alt)] rounded mx-auto"></div>
                <div className="flex justify-center items-center gap-4 mt-3">
                    <div className="h-4 w-16 bg-[var(--border-color-alt)] rounded"></div>
                    <div className="h-4 w-20 bg-[var(--border-color-alt)] rounded"></div>
                </div>
            </div>
        </div>
    );
};

export default FreelancerCardSkeleton;
