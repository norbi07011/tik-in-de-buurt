import React from 'react';

const AdCardSkeleton: React.FC = () => {
    return (
        <div className="bg-[#121212] border border-gray-800 rounded-lg overflow-hidden animate-pulse">
            <div className="h-40 bg-gray-800"></div>
            <div className="p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                    <div>
                        <div className="h-4 w-24 bg-gray-700 rounded mb-1.5"></div>
                        <div className="h-3 w-16 bg-gray-700 rounded"></div>
                    </div>
                </div>
                <div className="h-5 w-full bg-gray-700 rounded mt-4"></div>
                <div className="flex gap-2 mt-3">
                    <div className="h-5 w-14 bg-gray-700 rounded-full"></div>
                    <div className="h-5 w-16 bg-gray-700 rounded-full"></div>
                </div>
            </div>
        </div>
    );
};

export default AdCardSkeleton;
