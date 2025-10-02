import React from 'react';

const TestApp: React.FC = () => {
  const styles = {
    container: 'min-h-screen bg-white text-black p-8 font-sans',
    title: 'text-black text-4xl mb-4 font-bold',
    subtitle: 'text-gray-700 text-xl mb-4',
    statusBox: 'p-4 rounded-lg mb-4 text-white font-medium',
    frontend: 'bg-blue-600',
    css: 'bg-green-600',
    ready: 'bg-yellow-600'
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        🎉 TIK IN DE BUURT - TEST
      </h1>
      <p className={styles.subtitle}>
        Strona działa poprawnie! System jest uruchomiony.
      </p>
      <div className={`${styles.statusBox} ${styles.frontend}`}>
        ✅ Frontend: Połączony
      </div>
      <div className={`${styles.statusBox} ${styles.css}`}>
        ✅ CSS: Załadowane
      </div>
      <div className={`${styles.statusBox} ${styles.ready}`}>
        🚀 Gotowe do testowania!
      </div>
    </div>
  );
};

export default TestApp;