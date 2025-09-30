
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import './src/i18n';
import './src/styles/globals.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const Loader: React.FC = () => (
    <div className="app-loader-container">
        <div className="app-loader"></div>
    </div>
);


const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <React.Suspense fallback={<Loader />}>
      <App />
    </React.Suspense>
  </React.StrictMode>
);