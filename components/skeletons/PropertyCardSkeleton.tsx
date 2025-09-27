import React from 'react';

const PropertyCardSkeleton: React.FC = () => {
    return (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg overflow-hidden animate-pulse">
            <div className="h-48 bg-[var(--border-color)]"></div>
            <div className="p-4">
                <div className="h-7 w-3/5 bg-[var(--border-color-alt)] rounded mb-2"></div>
                <div className="h-5 w-4/5 bg-[var(--border-color-alt)] rounded"></div>
                <div className="h-4 w-1/2 bg-[var(--border-color-alt)] rounded mt-1"></div>
                <div className="flex justify-start items-center gap-4 mt-3 pt-3 border-t border-[var(--border-color-alt)]">
                    <div className="h-6 w-16 bg-[var(--border-color-alt)] rounded-full"></div>
                    <div className="h-6 w-20 bg-[var(--border-color-alt)] rounded-full"></div>
                </div>
            </div>
        </div>
    );
};

export default PropertyCardSkeleton;
