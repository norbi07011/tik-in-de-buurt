
import React from 'react';

const PropertyListingSkeleton: React.FC = () => {
    return (
        <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
            <div className="max-w-5xl mx-auto">
                <div className="h-5 w-48 bg-[var(--border-color-alt)] rounded mb-4"></div>

                {/* Gallery */}
                <div className="grid grid-cols-4 gap-2 h-[450px]">
                    <div className="col-span-4 sm:col-span-3 h-full rounded-lg bg-[var(--border-color-alt)]"></div>
                    <div className="hidden sm:grid col-span-1 grid-rows-4 gap-2 h-full">
                        <div className="h-full rounded-lg bg-[var(--border-color-alt)]"></div>
                        <div className="h-full rounded-lg bg-[var(--border-color-alt)]"></div>
                        <div className="h-full rounded-lg bg-[var(--border-color-alt)]"></div>
                        <div className="h-full rounded-lg bg-[var(--border-color-alt)]"></div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="h-8 w-3/4 bg-[var(--border-color-alt)] rounded"></div>
                                    <div className="h-5 w-1/2 bg-[var(--border-color-alt)] rounded mt-2"></div>
                                </div>
                                <div className="h-8 w-1/4 bg-[var(--border-color-alt)] rounded"></div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-[var(--background-alt)] p-4 rounded-lg h-24"></div>
                                    <div className="bg-[var(--background-alt)] p-4 rounded-lg h-24"></div>
                                    <div className="bg-[var(--background-alt)] p-4 rounded-lg h-24"></div>
                                    <div className="bg-[var(--background-alt)] p-4 rounded-lg h-24"></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6 rounded-lg space-y-3">
                            <div className="h-6 w-1/3 bg-[var(--border-color-alt)] rounded"></div>
                            <div className="h-4 w-full bg-[var(--border-color-alt)] rounded"></div>
                            <div className="h-4 w-full bg-[var(--border-color-alt)] rounded"></div>
                            <div className="h-4 w-5/6 bg-[var(--border-color-alt)] rounded"></div>
                        </div>
                    </div>
                    {/* Right Column */}
                    <div className="lg:col-span-1 space-y-6">
                         <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6 rounded-lg text-center">
                             <div className="w-20 h-20 rounded-full mx-auto bg-[var(--border-color-alt)]"></div>
                             <div className="h-6 w-3/4 bg-[var(--border-color-alt)] rounded mx-auto mt-2"></div>
                             <div className="h-12 w-full bg-[var(--border-color-alt)] rounded-full mt-4"></div>
                         </div>
                         <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6 rounded-lg h-64">
                             <div className="h-full w-full bg-[var(--border-color-alt)] rounded"></div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyListingSkeleton;
