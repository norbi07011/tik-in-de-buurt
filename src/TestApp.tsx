import React from 'react';

const TestApp: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#ffffff',
      color: '#000000',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#000000', fontSize: '2rem', marginBottom: '1rem' }}>
        🎉 TIK IN DE BUURT - TEST
      </h1>
      <p style={{ color: '#333333', fontSize: '1.2rem', marginBottom: '1rem' }}>
        Strona działa poprawnie! System jest uruchomiony.
      </p>
      <div style={{ 
        backgroundColor: '#3b82f6', 
        color: '#ffffff', 
        padding: '1rem', 
        borderRadius: '0.5rem',
        marginBottom: '1rem'
      }}>
        ✅ Frontend: Połączony
      </div>
      <div style={{ 
        backgroundColor: '#10b981', 
        color: '#ffffff', 
        padding: '1rem', 
        borderRadius: '0.5rem',
        marginBottom: '1rem'
      }}>
        ✅ CSS: Załadowane
      </div>
      <div style={{ 
        backgroundColor: '#f59e0b', 
        color: '#ffffff', 
        padding: '1rem', 
        borderRadius: '0.5rem'
      }}>
        🚀 Gotowe do testowania!
      </div>
    </div>
  );
};

export default TestApp;