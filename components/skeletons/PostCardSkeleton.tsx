import React from 'react';

const PostCardSkeleton: React.FC = () => {
    return (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-5 animate-pulse">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[var(--border-color-alt)]"></div>
                <div>
                    <div className="h-5 w-32 bg-[var(--border-color-alt)] rounded mb-2"></div>
                    <div className="h-4 w-16 bg-[var(--border-color-alt)] rounded"></div>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-2 mb-4">
                <div className="h-4 w-full bg-[var(--border-color-alt)] rounded"></div>
                <div className="h-4 w-5/6 bg-[var(--border-color-alt)] rounded"></div>
            </div>

            {/* Media Placeholder */}
            <div className="aspect-video w-full bg-[var(--border-color-alt)] rounded-lg"></div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-[var(--border-color-alt)] flex justify-around items-center">
                <div className="h-6 w-16 bg-[var(--border-color-alt)] rounded-full"></div>
                <div className="h-6 w-20 bg-[var(--border-color-alt)] rounded-full"></div>
                <div className="h-6 w-16 bg-[var(--border-color-alt)] rounded-full"></div>
            </div>
        </div>
    );
};

export default PostCardSkeleton;
