// 🗺️ OpenStreetMap Demo Page
import React, { useState } from 'react';
import MapsIntegration, { Business } from '../components/MapsIntegration';

const OpenStreetMapDemo: React.FC = () => {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [mapHeight, setMapHeight] = useState('500px');
  const [showUserLocation, setShowUserLocation] = useState(true);

  // Sample businesses for different Dutch cities
  const amsterdamBusinesses: Business[] = [
    {
      _id: '1',
      name: 'Café Central',
      category: 'cafes',
      description: 'Historic café in the heart of Amsterdam with traditional Dutch coffee and pastries.',
      address: 'Damrak 96, 1012 LP Amsterdam',
      coordinates: { lat: 52.3740, lng: 4.8910 },
      rating: 4.5,
      isOpen: true,
      owner: 'owner1',
      phone: '+31 20 123 4567',
      website: 'https://cafecentral.nl'
    },
    {
      _id: '2',
      name: 'Restaurant Greetje',
      category: 'restaurants',
      description: 'Modern Dutch cuisine with a focus on local and seasonal ingredients.',
      address: 'Peperstraat 23-25, 1011 TJ Amsterdam',
      coordinates: { lat: 52.3689, lng: 4.8984 },
      rating: 4.8,
      isOpen: true,
      owner: 'owner2',
      phone: '+31 20 779 7450'
    },
    {
      _id: '3',
      name: 'Yellow Bike Rental',
      category: 'services',
      description: 'Bike rental service for exploring Amsterdam. High-quality bikes and friendly service.',
      address: 'Nieuwezijds Kolk 29, 1012 PV Amsterdam',
      coordinates: { lat: 52.3741, lng: 4.8944 },
      rating: 4.3,
      isOpen: true,
      owner: 'owner3',
      phone: '+31 20 620 6940'
    },
    {
      _id: '4',
      name: 'Bloemenmarkt Flowers',
      category: 'shops',
      description: 'Fresh flowers from the famous floating flower market.',
      address: 'Singel 630, 1017 AZ Amsterdam',
      coordinates: { lat: 52.3671, lng: 4.8913 },
      rating: 4.2,
      isOpen: true,
      owner: 'owner4'
    },
    {
      _id: '5',
      name: 'Amsterdam Clinic',
      category: 'healthcare',
      description: 'General healthcare services with English-speaking doctors.',
      address: 'Keizersgracht 62, 1015 CS Amsterdam',
      coordinates: { lat: 52.3700, lng: 4.8883 },
      rating: 4.4,
      isOpen: true,
      owner: 'owner5'
    },
    {
      _id: '6',
      name: 'Pathe Tuschinski',
      category: 'entertainment',
      description: 'Historic cinema with modern facilities and luxury seating.',
      address: 'Reguliersbreestraat 26-34, 1017 CN Amsterdam',
      coordinates: { lat: 52.3664, lng: 4.8932 },
      rating: 4.6,
      isOpen: false, // Closed for demonstration
      owner: 'owner6'
    }
  ];

  const handleBusinessSelect = (business: Business) => {
    setSelectedBusiness(business);
    console.log('Selected business:', business);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🗺️ OpenStreetMap Integration Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Interactive maps powered by OpenStreetMap - completely free, no API keys required!
            Explore local businesses in Amsterdam with real-time updates.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="font-semibold text-gray-900 mb-2">100% Free</h3>
            <p className="text-gray-600 text-sm">No costs, no API keys, no limits. OpenStreetMap is completely free to use.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl mb-3">🚀</div>
            <h3 className="font-semibold text-gray-900 mb-2">Fast & Reliable</h3>
            <p className="text-gray-600 text-sm">Quick loading times and reliable service with global coverage.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="font-semibold text-gray-900 mb-2">Customizable</h3>
            <p className="text-gray-600 text-sm">Full control over styling, markers, and user experience.</p>
          </div>
        </div>

        {/* Map Controls */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">🛠️ Map Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Map Height
              </label>
              <select
                value={mapHeight}
                onChange={(e) => setMapHeight(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Select map height"
              >
                <option value="400px">Small (400px)</option>
                <option value="500px">Medium (500px)</option>
                <option value="600px">Large (600px)</option>
                <option value="700px">Extra Large (700px)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Location
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showUserLocation"
                  checked={showUserLocation}
                  onChange={(e) => setShowUserLocation(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="showUserLocation" className="text-sm text-gray-700">
                  Show my location
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statistics
              </label>
              <div className="text-sm text-gray-600">
                📍 {amsterdamBusinesses.length} businesses loaded<br/>
                🟢 {amsterdamBusinesses.filter(b => b.isOpen).length} currently open
              </div>
            </div>
          </div>
        </div>

        {/* Main Map */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">🌍 Interactive Map</h3>
          <MapsIntegration
            businesses={amsterdamBusinesses}
            onBusinessSelect={handleBusinessSelect}
            height={mapHeight}
            showUserLocation={showUserLocation}
            center={[52.3676, 4.9041]} // Amsterdam center
            zoom={13}
          />
        </div>

        {/* Selected Business Details */}
        {selectedBusiness && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-gray-900 text-xl">
                📋 Selected Business Details
              </h3>
              <button
                onClick={() => setSelectedBusiness(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-lg mb-2">{selectedBusiness.name}</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Category:</span> 
                    <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {selectedBusiness.category}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      selectedBusiness.isOpen 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedBusiness.isOpen ? '🟢 Open' : '🔴 Closed'}
                    </span>
                  </div>
                  {selectedBusiness.rating && (
                    <div>
                      <span className="font-medium">Rating:</span> 
                      <span className="ml-2">⭐ {selectedBusiness.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {selectedBusiness.phone && (
                    <div>
                      <span className="font-medium">Phone:</span> 
                      <a href={`tel:${selectedBusiness.phone}`} className="ml-2 text-blue-600 hover:underline">
                        {selectedBusiness.phone}
                      </a>
                    </div>
                  )}
                  {selectedBusiness.website && (
                    <div>
                      <span className="font-medium">Website:</span> 
                      <a 
                        href={selectedBusiness.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Description:</h5>
                <p className="text-gray-600 text-sm mb-4">{selectedBusiness.description}</p>
                
                <h5 className="font-medium mb-2">Address:</h5>
                <p className="text-gray-600 text-sm mb-4">📍 {selectedBusiness.address}</p>
                
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const coords = selectedBusiness.coordinates;
                      const directionsUrl = `https://www.openstreetmap.org/directions?from=&to=${coords?.lat},${coords?.lng}`;
                      window.open(directionsUrl, '_blank');
                    }}
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
                  >
                    🧭 Get Directions
                  </button>
                  
                  <button
                    onClick={() => {
                      const coords = selectedBusiness.coordinates;
                      const osmUrl = `https://www.openstreetmap.org/#map=18/${coords?.lat}/${coords?.lng}`;
                      window.open(osmUrl, '_blank');
                    }}
                    className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors text-sm"
                  >
                    🌐 View on OpenStreetMap
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Implementation Guide */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">🚀 Implementation Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-800 mb-3">✅ Completed Features:</h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>✅ OpenStreetMap integration with Leaflet.js</li>
                <li>✅ Interactive business markers with popups</li>
                <li>✅ User geolocation with animated marker</li>
                <li>✅ Custom business category icons</li>
                <li>✅ Responsive design and mobile support</li>
                <li>✅ Click-to-view business details</li>
                <li>✅ Direct links to OpenStreetMap directions</li>
                <li>✅ Real-time business status (open/closed)</li>
                <li>✅ Map controls and customization options</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-800 mb-3">🔄 Next Enhancements:</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>🔄 Integration with backend API endpoints</li>
                <li>🔄 Advanced filtering by category/rating</li>
                <li>🔄 Search functionality within map</li>
                <li>🔄 Clustering for dense business areas</li>
                <li>🔄 Route planning between multiple points</li>
                <li>🔄 Offline map caching</li>
                <li>🔄 Custom map themes and styling</li>
                <li>🔄 Business hours visualization</li>
                <li>🔄 Integration with notification system</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>🗺️ Powered by OpenStreetMap - Free and Open Source Mapping</p>
          <p className="mt-1">© OpenStreetMap contributors | Tik-in-de-buurt Demo</p>
        </div>
      </div>
    </div>
  );
};

export default OpenStreetMapDemo;