// Global Google Maps types declaration
declare global {
  interface Window {
    google: typeof google;
  }
}

// Re-export Google Maps types for better TypeScript support
export {};