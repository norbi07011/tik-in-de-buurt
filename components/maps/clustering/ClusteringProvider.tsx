import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { BusinessMarkerData } from '../GoogleMap';

// Google Maps types (window global)
type GoogleLatLngBounds = any;
type GoogleLatLng = any;

// 🎯 Clustering Context Types
interface ClusteringState {
  isEnabled: boolean;
  algorithm: 'grid' | 'kmeans' | 'supercluster';
  gridSize: number;
  minZoom: number;
  maxZoom: number;
  clusters: ClusterData[];
  selectedCluster: ClusterData | null;
  isLoading: boolean;
  error: string | null;
}

interface ClusterData {
  id: string;
  position: { lat: number; lng: number };
  businesses: BusinessMarkerData[];
  count: number;
  categories: string[];
  averageRating: number;
  bounds?: GoogleLatLngBounds;
}

type ClusteringAction = 
  | { type: 'SET_ENABLED'; enabled: boolean }
  | { type: 'SET_ALGORITHM'; algorithm: 'grid' | 'kmeans' | 'supercluster' }
  | { type: 'SET_GRID_SIZE'; size: number }
  | { type: 'SET_MIN_ZOOM'; zoom: number }
  | { type: 'SET_MAX_ZOOM'; zoom: number }
  | { type: 'SET_CLUSTERS'; clusters: ClusterData[] }
  | { type: 'SELECT_CLUSTER'; cluster: ClusterData | null }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'CLEAR_CLUSTERS' };

interface ClusteringContextValue {
  state: ClusteringState;
  dispatch: React.Dispatch<ClusteringAction>;
  // Action creators
  setEnabled: (enabled: boolean) => void;
  setAlgorithm: (algorithm: 'grid' | 'kmeans' | 'supercluster') => void;
  setGridSize: (size: number) => void;
  setMinZoom: (zoom: number) => void;
  setMaxZoom: (zoom: number) => void;
  setClusters: (clusters: ClusterData[]) => void;
  selectCluster: (cluster: ClusterData | null) => void;
  clearClusters: () => void;
  // Computed properties
  isClusteringActive: boolean;
  totalBusinesses: number;
  totalClusters: number;
}

// 🏭 Initial State
const initialState: ClusteringState = {
  isEnabled: true,
  algorithm: 'grid',
  gridSize: 60,
  minZoom: 3,
  maxZoom: 15,
  clusters: [],
  selectedCluster: null,
  isLoading: false,
  error: null
};

// 🔄 Reducer
function clusteringReducer(state: ClusteringState, action: ClusteringAction): ClusteringState {
  switch (action.type) {
    case 'SET_ENABLED':
      return {
        ...state,
        isEnabled: action.enabled,
        selectedCluster: action.enabled ? state.selectedCluster : null
      };
      
    case 'SET_ALGORITHM':
      return {
        ...state,
        algorithm: action.algorithm,
        clusters: [], // Clear existing clusters when algorithm changes
        selectedCluster: null
      };
      
    case 'SET_GRID_SIZE':
      return {
        ...state,
        gridSize: action.size,
        clusters: [], // Reclustering needed
        selectedCluster: null
      };
      
    case 'SET_MIN_ZOOM':
      return {
        ...state,
        minZoom: action.zoom
      };
      
    case 'SET_MAX_ZOOM':
      return {
        ...state,
        maxZoom: action.zoom
      };
      
    case 'SET_CLUSTERS':
      return {
        ...state,
        clusters: action.clusters,
        isLoading: false,
        error: null
      };
      
    case 'SELECT_CLUSTER':
      return {
        ...state,
        selectedCluster: action.cluster
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.loading,
        error: action.loading ? null : state.error
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
        isLoading: false
      };
      
    case 'CLEAR_CLUSTERS':
      return {
        ...state,
        clusters: [],
        selectedCluster: null,
        error: null
      };
      
    default:
      return state;
  }
}

// 🎯 Context
const ClusteringContext = createContext<ClusteringContextValue | undefined>(undefined);

// 🎯 Provider Props
interface ClusteringProviderProps {
  children: React.ReactNode;
  initialEnabled?: boolean;
  initialAlgorithm?: 'grid' | 'kmeans' | 'supercluster';
  initialGridSize?: number;
  onStateChange?: (state: ClusteringState) => void;
}

// 🎯 Provider Component
export const ClusteringProvider: React.FC<ClusteringProviderProps> = ({
  children,
  initialEnabled = true,
  initialAlgorithm = 'grid',
  initialGridSize = 60,
  onStateChange
}) => {
  const [state, dispatch] = useReducer(clusteringReducer, {
    ...initialState,
    isEnabled: initialEnabled,
    algorithm: initialAlgorithm,
    gridSize: initialGridSize
  });

  // 🎬 Action creators
  const setEnabled = React.useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_ENABLED', enabled });
  }, []);

  const setAlgorithm = React.useCallback((algorithm: 'grid' | 'kmeans' | 'supercluster') => {
    dispatch({ type: 'SET_ALGORITHM', algorithm });
  }, []);

  const setGridSize = React.useCallback((size: number) => {
    dispatch({ type: 'SET_GRID_SIZE', size });
  }, []);

  const setMinZoom = React.useCallback((zoom: number) => {
    dispatch({ type: 'SET_MIN_ZOOM', zoom });
  }, []);

  const setMaxZoom = React.useCallback((zoom: number) => {
    dispatch({ type: 'SET_MAX_ZOOM', zoom });
  }, []);

  const setClusters = React.useCallback((clusters: ClusterData[]) => {
    dispatch({ type: 'SET_CLUSTERS', clusters });
  }, []);

  const selectCluster = React.useCallback((cluster: ClusterData | null) => {
    dispatch({ type: 'SELECT_CLUSTER', cluster });
  }, []);

  const clearClusters = React.useCallback(() => {
    dispatch({ type: 'CLEAR_CLUSTERS' });
  }, []);

  // 📊 Computed properties
  const isClusteringActive = state.isEnabled && state.clusters.length > 0;
  const totalBusinesses = state.clusters.reduce((sum, cluster) => sum + cluster.count, 0);
  const totalClusters = state.clusters.length;

  // 🎬 Context value
  const contextValue: ClusteringContextValue = {
    state,
    dispatch,
    setEnabled,
    setAlgorithm,
    setGridSize,
    setMinZoom,
    setMaxZoom,
    setClusters,
    selectCluster,
    clearClusters,
    isClusteringActive,
    totalBusinesses,
    totalClusters
  };

  // 📢 Notify parent of state changes
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  return (
    <ClusteringContext.Provider value={contextValue}>
      {children}
    </ClusteringContext.Provider>
  );
};

// 🎯 Hook
export const useClustering = () => {
  const context = useContext(ClusteringContext);
  if (context === undefined) {
    throw new Error('useClustering must be used within a ClusteringProvider');
  }
  return context;
};

// 🎯 Cluster utilities
export const createCluster = (
  businesses: BusinessMarkerData[],
  position: { lat: number; lng: number },
  id?: string
): ClusterData => {
  const categories = [...new Set(businesses.map(b => b.category))];
  const ratings = businesses.filter(b => b.rating && b.rating > 0).map(b => b.rating!);
  const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

  return {
    id: id || `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    position,
    businesses,
    count: businesses.length,
    categories,
    averageRating: Math.round(averageRating * 10) / 10
  };
};

export const calculateClusterPosition = (businesses: BusinessMarkerData[]): { lat: number; lng: number } => {
  if (businesses.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const totalLat = businesses.reduce((sum, business) => sum + business.position.lat, 0);
  const totalLng = businesses.reduce((sum, business) => sum + business.position.lng, 0);

  return {
    lat: totalLat / businesses.length,
    lng: totalLng / businesses.length
  };
};

export const isBusinessInBounds = (
  business: BusinessMarkerData, 
  bounds: GoogleLatLngBounds
): boolean => {
  if (!bounds || !business.position || !window.google?.maps) return false;
  
  try {
    const position = new window.google.maps.LatLng(business.position.lat, business.position.lng);
    return bounds.contains(position);
  } catch (error) {
    console.warn('Error checking business bounds:', error);
    return false;
  }
};

// 🎯 Export types
export type { 
  ClusteringState, 
  ClusterData, 
  ClusteringAction, 
  ClusteringContextValue,
  ClusteringProviderProps 
};