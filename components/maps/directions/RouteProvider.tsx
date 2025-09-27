import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { BusinessMarkerData } from '../GoogleMap';
import { RouteResult } from './DirectionsService';

// 🌐 Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

type GoogleTravelMode = any;
type GoogleLatLng = any;

// Route State Interface
export interface RouteState {
  // Route data
  activeRoute: RouteResult | null;
  origin: GoogleLatLng | null;
  destination: BusinessMarkerData | null;
  waypoints: BusinessMarkerData[];
  
  // Route settings
  travelMode: GoogleTravelMode;
  optimizeWaypoints: boolean;
  avoidHighways: boolean;
  avoidTolls: boolean;
  
  // UI state
  isCalculating: boolean;
  isRoutePanelVisible: boolean;
  selectedStepIndex: number | null;
  error: string | null;
  
  // History
  routeHistory: RouteResult[];
  savedRoutes: SavedRoute[];
}

// Saved Route Interface
export interface SavedRoute {
  id: string;
  name: string;
  origin: GoogleLatLng;
  destination: BusinessMarkerData;
  waypoints: BusinessMarkerData[];
  travelMode: GoogleTravelMode;
  totalDistance: string;
  totalDuration: string;
  createdAt: Date;
}

// Route Actions
type RouteAction =
  | { type: 'SET_ORIGIN'; payload: GoogleLatLng }
  | { type: 'SET_DESTINATION'; payload: BusinessMarkerData }
  | { type: 'ADD_WAYPOINT'; payload: BusinessMarkerData }
  | { type: 'REMOVE_WAYPOINT'; payload: number }
  | { type: 'REORDER_WAYPOINTS'; payload: BusinessMarkerData[] }
  | { type: 'SET_TRAVEL_MODE'; payload: GoogleTravelMode }
  | { type: 'SET_ROUTE_OPTIONS'; payload: Partial<Pick<RouteState, 'optimizeWaypoints' | 'avoidHighways' | 'avoidTolls'>> }
  | { type: 'SET_CALCULATING'; payload: boolean }
  | { type: 'SET_ROUTE_RESULT'; payload: RouteResult }
  | { type: 'SET_ROUTE_ERROR'; payload: string }
  | { type: 'CLEAR_ROUTE' }
  | { type: 'TOGGLE_ROUTE_PANEL' }
  | { type: 'SET_ROUTE_PANEL_VISIBLE'; payload: boolean }
  | { type: 'SET_SELECTED_STEP'; payload: number | null }
  | { type: 'SAVE_ROUTE'; payload: SavedRoute }
  | { type: 'REMOVE_SAVED_ROUTE'; payload: string }
  | { type: 'CLEAR_ERROR' };

// Initial State
const initialState: RouteState = {
  activeRoute: null,
  origin: null,
  destination: null,
  waypoints: [],
  
  travelMode: window.google?.maps?.TravelMode?.DRIVING || 'DRIVING',
  optimizeWaypoints: true,
  avoidHighways: false,
  avoidTolls: false,
  
  isCalculating: false,
  isRoutePanelVisible: false,
  selectedStepIndex: null,
  error: null,
  
  routeHistory: [],
  savedRoutes: []
};

// Reducer
const routeReducer = (state: RouteState, action: RouteAction): RouteState => {
  switch (action.type) {
    case 'SET_ORIGIN':
      return { ...state, origin: action.payload, error: null };
      
    case 'SET_DESTINATION':
      return { ...state, destination: action.payload, error: null };
      
    case 'ADD_WAYPOINT':
      // Prevent duplicate waypoints
      if (state.waypoints.some(wp => wp.id === action.payload.id)) {
        return state;
      }
      return { 
        ...state, 
        waypoints: [...state.waypoints, action.payload],
        error: null 
      };
      
    case 'REMOVE_WAYPOINT':
      return {
        ...state,
        waypoints: state.waypoints.filter((_, index) => index !== action.payload),
        error: null
      };
      
    case 'REORDER_WAYPOINTS':
      return { ...state, waypoints: action.payload, error: null };
      
    case 'SET_TRAVEL_MODE':
      return { ...state, travelMode: action.payload, error: null };
      
    case 'SET_ROUTE_OPTIONS':
      return { ...state, ...action.payload, error: null };
      
    case 'SET_CALCULATING':
      return { ...state, isCalculating: action.payload };
      
    case 'SET_ROUTE_RESULT':
      return {
        ...state,
        activeRoute: action.payload,
        isCalculating: false,
        error: null,
        routeHistory: [action.payload, ...state.routeHistory.slice(0, 9)] // Keep last 10 routes
      };
      
    case 'SET_ROUTE_ERROR':
      return {
        ...state,
        activeRoute: null,
        isCalculating: false,
        error: action.payload
      };
      
    case 'CLEAR_ROUTE':
      return {
        ...state,
        activeRoute: null,
        destination: null,
        waypoints: [],
        isCalculating: false,
        isRoutePanelVisible: false,
        selectedStepIndex: null,
        error: null
      };
      
    case 'TOGGLE_ROUTE_PANEL':
      return {
        ...state,
        isRoutePanelVisible: !state.isRoutePanelVisible
      };
      
    case 'SET_ROUTE_PANEL_VISIBLE':
      return {
        ...state,
        isRoutePanelVisible: action.payload
      };
      
    case 'SET_SELECTED_STEP':
      return {
        ...state,
        selectedStepIndex: action.payload
      };
      
    case 'SAVE_ROUTE':
      return {
        ...state,
        savedRoutes: [action.payload, ...state.savedRoutes]
      };
      
    case 'REMOVE_SAVED_ROUTE':
      return {
        ...state,
        savedRoutes: state.savedRoutes.filter(route => route.id !== action.payload)
      };
      
    case 'CLEAR_ERROR':
      return { ...state, error: null };
      
    default:
      return state;
  }
};

// Context Interface
export interface RouteContextType {
  state: RouteState;
  
  // Route management
  setOrigin: (origin: GoogleLatLng) => void;
  setDestination: (destination: BusinessMarkerData) => void;
  addWaypoint: (business: BusinessMarkerData) => void;
  removeWaypoint: (index: number) => void;
  reorderWaypoints: (waypoints: BusinessMarkerData[]) => void;
  clearRoute: () => void;
  
  // Route settings
  setTravelMode: (mode: GoogleTravelMode) => void;
  setRouteOptions: (options: Partial<Pick<RouteState, 'optimizeWaypoints' | 'avoidHighways' | 'avoidTolls'>>) => void;
  
  // Route calculation
  setCalculating: (calculating: boolean) => void;
  setRouteResult: (result: RouteResult) => void;
  setRouteError: (error: string) => void;
  
  // UI state
  toggleRoutePanel: () => void;
  setRoutePanelVisible: (visible: boolean) => void;
  setSelectedStep: (stepIndex: number | null) => void;
  
  // Route persistence
  saveRoute: (name: string) => void;
  removeSavedRoute: (routeId: string) => void;
  
  // Utilities
  clearError: () => void;
  hasActiveRoute: boolean;
  canCalculateRoute: boolean;
}

// Context
const RouteContext = createContext<RouteContextType | undefined>(undefined);

// Provider Props
export interface RouteProviderProps {
  children: ReactNode;
}

// Provider Component
export const RouteProvider: React.FC<RouteProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(routeReducer, initialState);

  // Route management actions
  const setOrigin = useCallback((origin: GoogleLatLng) => {
    dispatch({ type: 'SET_ORIGIN', payload: origin });
  }, []);

  const setDestination = useCallback((destination: BusinessMarkerData) => {
    dispatch({ type: 'SET_DESTINATION', payload: destination });
  }, []);

  const addWaypoint = useCallback((business: BusinessMarkerData) => {
    dispatch({ type: 'ADD_WAYPOINT', payload: business });
  }, []);

  const removeWaypoint = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_WAYPOINT', payload: index });
  }, []);

  const reorderWaypoints = useCallback((waypoints: BusinessMarkerData[]) => {
    dispatch({ type: 'REORDER_WAYPOINTS', payload: waypoints });
  }, []);

  const clearRoute = useCallback(() => {
    dispatch({ type: 'CLEAR_ROUTE' });
  }, []);

  // Route settings actions
  const setTravelMode = useCallback((mode: GoogleTravelMode) => {
    dispatch({ type: 'SET_TRAVEL_MODE', payload: mode });
  }, []);

  const setRouteOptions = useCallback((options: Partial<Pick<RouteState, 'optimizeWaypoints' | 'avoidHighways' | 'avoidTolls'>>) => {
    dispatch({ type: 'SET_ROUTE_OPTIONS', payload: options });
  }, []);

  // Route calculation actions
  const setCalculating = useCallback((calculating: boolean) => {
    dispatch({ type: 'SET_CALCULATING', payload: calculating });
  }, []);

  const setRouteResult = useCallback((result: RouteResult) => {
    dispatch({ type: 'SET_ROUTE_RESULT', payload: result });
  }, []);

  const setRouteError = useCallback((error: string) => {
    dispatch({ type: 'SET_ROUTE_ERROR', payload: error });
  }, []);

  // UI state actions
  const toggleRoutePanel = useCallback(() => {
    dispatch({ type: 'TOGGLE_ROUTE_PANEL' });
  }, []);

  const setRoutePanelVisible = useCallback((visible: boolean) => {
    dispatch({ type: 'SET_ROUTE_PANEL_VISIBLE', payload: visible });
  }, []);

  const setSelectedStep = useCallback((stepIndex: number | null) => {
    dispatch({ type: 'SET_SELECTED_STEP', payload: stepIndex });
  }, []);

  // Route persistence actions
  const saveRoute = useCallback((name: string) => {
    if (!state.activeRoute || !state.origin || !state.destination) return;
    
    const savedRoute: SavedRoute = {
      id: `route_${Date.now()}`,
      name,
      origin: state.origin,
      destination: state.destination,
      waypoints: state.waypoints,
      travelMode: state.travelMode,
      totalDistance: state.activeRoute.totalDistance,
      totalDuration: state.activeRoute.totalDuration,
      createdAt: new Date()
    };
    
    dispatch({ type: 'SAVE_ROUTE', payload: savedRoute });
  }, [state.activeRoute, state.origin, state.destination, state.waypoints, state.travelMode]);

  const removeSavedRoute = useCallback((routeId: string) => {
    dispatch({ type: 'REMOVE_SAVED_ROUTE', payload: routeId });
  }, []);

  // Utility actions
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Computed values
  const hasActiveRoute = Boolean(state.activeRoute);
  const canCalculateRoute = Boolean(state.origin && state.destination);

  const contextValue: RouteContextType = {
    state,
    
    // Route management
    setOrigin,
    setDestination,
    addWaypoint,
    removeWaypoint,
    reorderWaypoints,
    clearRoute,
    
    // Route settings
    setTravelMode,
    setRouteOptions,
    
    // Route calculation
    setCalculating,
    setRouteResult,
    setRouteError,
    
    // UI state
    toggleRoutePanel,
    setRoutePanelVisible,
    setSelectedStep,
    
    // Route persistence
    saveRoute,
    removeSavedRoute,
    
    // Utilities
    clearError,
    hasActiveRoute,
    canCalculateRoute
  };

  return (
    <RouteContext.Provider value={contextValue}>
      {children}
    </RouteContext.Provider>
  );
};

// Custom Hook
export const useRoute = (): RouteContextType => {
  const context = useContext(RouteContext);
  if (context === undefined) {
    throw new Error('useRoute must be used within a RouteProvider');
  }
  return context;
};

export default RouteProvider;