import React, { useState, useEffect } from 'react';
import type { Address } from '../src/types';
import MapSkeleton from './skeletons/MapSkeleton';

interface BusinessMapProps {
    address: Address;
}

const BusinessMap: React.FC<BusinessMapProps> = ({ address }) => {
    const [isLoading, setIsLoading] = useState(true);
    const fullAddress = `${address.street}, ${address.postalCode} ${address.city}, ${address.country}`;
    const encodedAddress = encodeURIComponent(fullAddress);
    
    // Construct the OpenStreetMap embed URL
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=&layer=mapnik&marker=0,0&s=${encodedAddress}`;

    useEffect(() => {
        // We can't know when an iframe actually finishes loading its content,
        // so we'll simulate a loading time to show the skeleton.
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000); // Simulate 1s load time for the map

        return () => clearTimeout(timer);
    }, [mapUrl]); // Re-run if the address changes

    return (
        <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden relative">
            {isLoading && <MapSkeleton />}
            <iframe
                width="100%"
                height="100%"
                className={`transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                loading="lazy"
                allowFullScreen
                src={mapUrl}
                style={{ border: 0 }}
                title={`Map of ${fullAddress}`}
            ></iframe>
        </div>
    );
};

export default BusinessMap;
