import React from 'react';

const BusinessProfileSkeleton: React.FC = () => {
    return (
        <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
            <div className="max-w-4xl mx-auto">
                <div className="h-6 w-48 bg-gray-800 rounded mb-4"></div>

                {/* Header Section */}
                <div className="relative h-48 md:h-64 rounded-lg bg-gray-800 mb-[-80px]"></div>
                
                <div className="relative bg-[#121212] border border-gray-800 rounded-lg p-6">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
                        <div className="w-28 h-28 rounded-md bg-gray-700 -mt-16"></div>
                        <div className="flex-grow">
                            <div className="h-8 w-48 bg-gray-700 rounded mb-2 mx-auto md:mx-0"></div>
                            <div className="h-5 w-32 bg-gray-700 rounded mx-auto md:mx-0"></div>
                        </div>
                        <div className="h-8 w-24 bg-gray-700 rounded"></div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-6 border-b border-gray-800">
                    <div className="flex space-x-6">
                        <div className="h-10 w-24 bg-transparent border-b-2 border-gray-700"></div>
                        <div className="h-10 w-20 bg-transparent"></div>
                        <div className="h-10 w-28 bg-transparent"></div>
                    </div>
                </div>

                {/* Tab Content Skeleton (showing info tab) */}
                <div className="mt-6">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 bg-[#121212] border border-gray-800 p-6 rounded-lg space-y-4">
                           <div className="h-6 w-32 bg-gray-700 rounded"></div>
                           <div className="h-4 w-full bg-gray-700 rounded"></div>
                           <div className="h-4 w-full bg-gray-700 rounded"></div>
                           <div className="h-4 w-3/4 bg-gray-700 rounded"></div>
                           <div className="h-6 w-40 bg-gray-700 rounded mt-6"></div>
                           <div className="flex flex-wrap gap-2">
                               <div className="h-7 w-24 bg-gray-700 rounded-full"></div>
                               <div className="h-7 w-32 bg-gray-700 rounded-full"></div>
                               <div className="h-7 w-28 bg-gray-700 rounded-full"></div>
                           </div>
                        </div>
                        <div className="md:col-span-1 bg-[#121212] border border-gray-800 p-6 rounded-lg space-y-3">
                            <div className="h-6 w-40 bg-gray-700 rounded"></div>
                            <div className="h-4 w-full bg-gray-700 rounded"></div>
                            <div className="h-4 w-full bg-gray-700 rounded"></div>
                            <div className="h-4 w-full bg-gray-700 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessProfileSkeleton;
