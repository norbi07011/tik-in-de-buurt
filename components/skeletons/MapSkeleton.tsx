import React from 'react';

const MapSkeleton: React.FC = () => {
    return (
        <div className="absolute inset-0 bg-[var(--border-color-alt)] animate-pulse flex items-center justify-center">
            <p className="text-[var(--text-muted)]">Loading map...</p>
        </div>
    );
};

export default MapSkeleton;
