
import React from 'react';

const BusinessCardSkeleton: React.FC = () => {
    return (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg overflow-hidden animate-pulse">
            <div className="h-32 bg-[var(--border-color)]"></div>
            <div className="p-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-[var(--border-color-alt)]"></div>
                    <div>
                        <div className="h-5 w-32 bg-[var(--border-color-alt)] rounded mb-2"></div>
                        <div className="h-4 w-20 bg-[var(--border-color-alt)] rounded"></div>
                    </div>
                </div>
                <div className="h-4 w-full bg-[var(--border-color-alt)] rounded mt-4"></div>
                <div className="h-4 w-3/4 bg-[var(--border-color-alt)] rounded mt-2"></div>
                <div className="flex justify-between items-center mt-4">
                    <div className="h-4 w-16 bg-[var(--border-color-alt)] rounded"></div>
                    <div className="h-4 w-24 bg-[var(--border-color-alt)] rounded"></div>
                </div>
            </div>
        </div>
    );
};

export default BusinessCardSkeleton;
