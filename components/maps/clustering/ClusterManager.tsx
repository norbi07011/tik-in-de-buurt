import React, { useEffect, useRef, useCallback } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { BusinessMarkerData } from '../GoogleMap';

// 🌐 Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

type GoogleMap = any;
type GoogleMarker = any;
type GoogleLatLng = any;
type GoogleLatLngBounds = any;

// 🔧 Clustering Configuration
interface ClusteringConfig {
  enabled: boolean;
  minClusterSize: number;
  maxZoom: number;
  gridSize: number;
  zoomOnClick: boolean;
  averageCenter: boolean;
  ignoreHidden: boolean;
}

// 📍 Cluster Manager Props
interface ClusterManagerProps {
  map: GoogleMap | null;
  businesses: BusinessMarkerData[];
  markers: GoogleMarker[];
  config?: Partial<ClusteringConfig>;
  onClusterClick?: (cluster: any, businesses: BusinessMarkerData[]) => void;
  onMarkerClick?: (marker: GoogleMarker, business: BusinessMarkerData) => void;
}

// 🎨 Custom Cluster Icon Renderer
class CustomClusterRenderer {
  private businessCategories: { [key: string]: number } = {};

  constructor(businesses: BusinessMarkerData[]) {
    this.updateBusinessData(businesses);
  }

  updateBusinessData(businesses: BusinessMarkerData[]) {
    this.businessCategories = {};
    businesses.forEach(business => {
      const category = business.category || 'other';
      this.businessCategories[category] = (this.businessCategories[category] || 0) + 1;
    });
  }

  render(count: number, position: GoogleLatLng): GoogleMarker {
    // 🎨 Determine cluster color based on predominant category
    const predominantCategory = this.getPredominantCategory();
    const clusterColor = this.getCategoryColor(predominantCategory);
    
    // 📏 Determine cluster size based on business count
    const size = this.getClusterSize(count);
    
    // 🔤 Create cluster SVG icon
    const svg = this.createClusterSVG({
      count,
      size,
      color: clusterColor,
      category: predominantCategory
    });

    return new window.google.maps.Marker({
      position,
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        scaledSize: new window.google.maps.Size(size, size),
        anchor: new window.google.maps.Point(size / 2, size / 2)
      },
      title: `${count} businesses in this area`,
      zIndex: 999
    });
  }

  private getPredominantCategory(): string {
    let maxCount = 0;
    let predominant = 'other';
    
    Object.entries(this.businessCategories).forEach(([category, count]) => {
      if (count > maxCount) {
        maxCount = count;
        predominant = category;
      }
    });
    
    return predominant;
  }

  private getCategoryColor(category: string): string {
    const categoryColors: { [key: string]: string } = {
      restaurant: '#ef4444',    // Red
      retail: '#3b82f6',        // Blue
      healthcare: '#10b981',    // Green
      beauty: '#f59e0b',        // Amber
      service: '#8b5cf6',       // Purple
      education: '#06b6d4',     // Cyan
      entertainment: '#ec4899', // Pink
      automotive: '#6b7280',    // Gray
      other: '#64748b'          // Slate
    };
    
    return categoryColors[category] || categoryColors.other;
  }

  private getClusterSize(count: number): number {
    if (count < 10) return 40;
    if (count < 50) return 50;
    if (count < 100) return 60;
    return 70;
  }

  private createClusterSVG(options: {
    count: number;
    size: number;
    color: string;
    category: string;
  }): string {
    const { count, size, color, category } = options;
    const fontSize = size > 50 ? 14 : 12;
    const strokeWidth = 3;
    
    // 🎨 Create gradient for depth effect
    const gradient = `
      <defs>
        <radialGradient id="clusterGradient" cx="30%" cy="30%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.3"/>
          <stop offset="100%" style="stop-color:${color};stop-opacity:1"/>
        </radialGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
      </defs>
    `;

    // 🔢 Format count display
    const displayCount = count > 999 ? '999+' : count.toString();
    
    return `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        ${gradient}
        <circle 
          cx="${size/2}" 
          cy="${size/2}" 
          r="${(size-strokeWidth)/2}"
          fill="url(#clusterGradient)"
          stroke="#ffffff"
          stroke-width="${strokeWidth}"
          filter="url(#shadow)"
        />
        <text 
          x="${size/2}" 
          y="${size/2 + fontSize/3}" 
          text-anchor="middle" 
          fill="#ffffff" 
          font-family="system-ui, -apple-system, sans-serif"
          font-size="${fontSize}px" 
          font-weight="600"
          style="text-shadow: 1px 1px 2px rgba(0,0,0,0.5)"
        >
          ${displayCount}
        </text>
      </svg>
    `;
  }
}

// 🗺️ Main Cluster Manager Component
const ClusterManager: React.FC<ClusterManagerProps> = ({
  map,
  businesses,
  markers,
  config = {},
  onClusterClick,
  onMarkerClick
}) => {
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const renderersRef = useRef<{ [key: string]: CustomClusterRenderer }>({});

  // 🔧 Default clustering configuration
  const defaultConfig: ClusteringConfig = {
    enabled: true,
    minClusterSize: parseInt(import.meta.env.VITE_CLUSTER_MIN_SIZE || '10'),
    maxZoom: parseInt(import.meta.env.VITE_CLUSTER_MAX_ZOOM || '15'),
    gridSize: parseInt(import.meta.env.VITE_CLUSTER_GRID_SIZE || '40'),
    zoomOnClick: true,
    averageCenter: true,
    ignoreHidden: true
  };

  const finalConfig = { ...defaultConfig, ...config };

  // 🎯 Initialize clustering when map and markers are ready
  useEffect(() => {
    if (!map || !finalConfig.enabled || markers.length === 0) {
      return;
    }

    // 🧹 Clean up existing clusterer
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }

    // 🎨 Create custom renderer for this set of businesses
    const renderer = new CustomClusterRenderer(businesses);
    renderersRef.current['default'] = renderer;

    // 🗺️ Initialize MarkerClusterer
    const clusterer = new MarkerClusterer({
      map,
      markers,
      algorithm: new (MarkerClusterer as any).SuperClusterAlgorithm({
        minPoints: finalConfig.minClusterSize,
        maxZoom: finalConfig.maxZoom,
        radius: finalConfig.gridSize
      }),
      renderer: {
        render: (cluster, stats) => {
          const position = cluster.position;
          const count = cluster.count;
          
          // 📍 Get businesses in this cluster area
          const clusterBounds = new window.google.maps.LatLngBounds();
          cluster.markers.forEach((marker: any) => {
            if (marker.getPosition()) {
              clusterBounds.extend(marker.getPosition()!);
            }
          });
          
          // 🎨 Create cluster marker
          const clusterMarker = renderer.render(count, position);
          
          // 👆 Add click handler for cluster
          if (onClusterClick) {
            clusterMarker.addListener('click', () => {
              // 📍 Find businesses in cluster bounds
              const clusterBusinesses = businesses.filter(business => {
                const businessPos = new window.google.maps.LatLng(
                  business.position.lat, 
                  business.position.lng
                );
                return clusterBounds.contains(businessPos);
              });
              
              onClusterClick(cluster, clusterBusinesses);
            });
          }
          
          return clusterMarker;
        }
      }
    });

    clustererRef.current = clusterer;

    // 🧹 Cleanup function
    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current = null;
      }
    };

  }, [map, markers, businesses, finalConfig, onClusterClick]);

  // 🔄 Update markers when businesses change
  useEffect(() => {
    if (clustererRef.current && markers.length > 0) {
      clustererRef.current.clearMarkers();
      clustererRef.current.addMarkers(markers);
      
      // 🎨 Update renderer with new business data
      if (renderersRef.current['default']) {
        renderersRef.current['default'].updateBusinessData(businesses);
      }
    }
  }, [businesses, markers]);

  // 📊 Performance monitoring (development only)
  useEffect(() => {
    if (import.meta.env.DEV && clustererRef.current) {
      const startTime = performance.now();
      
      setTimeout(() => {
        const endTime = performance.now();
        console.log(`🗺️ Clustering ${markers.length} markers took ${(endTime - startTime).toFixed(2)}ms`);
      }, 100);
    }
  }, [markers.length]);

  // 🎛️ Provide clustering controls API
  const clusteringAPI = useCallback(() => ({
    recalculate: () => {
      if (clustererRef.current) {
        (clustererRef.current as any).repaint?.();
      }
    },
    
    setMinClusterSize: (size: number) => {
      // This would require recreating the clusterer with new config
      console.log('🔧 Cluster size change requested:', size);
    },
    
    getClusterStats: () => {
      if (!clustererRef.current) return null;
      
      return {
        totalMarkers: markers.length,
        clustersVisible: 'unknown', // MarkerClusterer doesn't expose this easily
        config: finalConfig
      };
    }
  }), [markers.length, finalConfig]);

  // 📤 Component doesn't need imperative handle for now

  // 🎨 Component renders nothing - clustering is handled by Google Maps
  return null;
};

export default ClusterManager;
export type { ClusteringConfig, ClusterManagerProps };
export { CustomClusterRenderer };