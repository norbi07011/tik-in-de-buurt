import React from 'react';

const GallerySkeleton: React.FC = () => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
            {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="aspect-square bg-[var(--card-bg)] border border-[var(--border-color-alt)] rounded-lg"></div>
            ))}
        </div>
    );
};

export default GallerySkeleton;
