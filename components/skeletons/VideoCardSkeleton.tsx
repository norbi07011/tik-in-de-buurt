import React from 'react';

const VideoCardSkeleton: React.FC = () => {
    return (
        <div className="w-full h-full relative snap-start rounded-xl overflow-hidden bg-black animate-pulse">
            <div className="w-full h-full bg-gray-900"></div>
            
            {/* Overlay Skeleton */}
            <div className="absolute inset-0 flex flex-col justify-end p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gray-800"></div>
                    <div>
                        <div className="h-5 w-32 bg-gray-800 rounded"></div>
                        <div className="h-4 w-20 bg-gray-800 rounded mt-2"></div>
                    </div>
                </div>
                <div className="h-5 w-4/5 bg-gray-800 rounded mb-2"></div>
                <div className="flex gap-2 mb-4">
                    <div className="h-6 w-16 bg-gray-800 rounded-md"></div>
                    <div className="h-6 w-20 bg-gray-800 rounded-md"></div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-12 bg-gray-800 rounded-full"></div>
                    <div className="flex-1 h-12 bg-gray-800 rounded-full"></div>
                    <div className="flex-1 h-12 bg-gray-800 rounded-full"></div>
                </div>
            </div>
        </div>
    );
};

export default VideoCardSkeleton;
