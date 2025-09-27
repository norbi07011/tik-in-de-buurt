import React from 'react';
import { useStore } from '../src/store';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useStore(state => ({
    theme: state.theme,
    toggleTheme: state.toggleTheme,
  }));

  const isDarkMode = theme === 'dark';

  return (
    <label className="bb8-toggle">
      <input
        className="bb8-toggle_checkbox"
        type="checkbox"
        checked={isDarkMode}
        onChange={toggleTheme}
        aria-label="Toggle theme"
      />
      <div className="bb8-toggle_container">
        <div className="bb8-toggle_scenery">
          <div className="bb8-toggle_star"></div>
          <div className="bb8-toggle_star"></div>
          <div className="bb8-toggle_star"></div>
          <div className="bb8-toggle_star"></div>
          <div className="bb8-toggle_star"></div>
          <div className="bb8-toggle_star"></div>
          <div className="bb8-toggle_star"></div>
          <div className="tatooine-1"></div>
          <div className="tatooine-2"></div>
          <div className="gomrassen"></div>
          <div className="hermes"></div>
          <div className="chenini"></div>
          <div className="bb8-toggle_cloud"></div>
          <div className="bb8-toggle_cloud"></div>
          <div className="bb8-toggle_cloud"></div>
        </div>
        <div className="bb8">
          <div className="bb8_head-container">
            <div className="bb8_antenna"></div>
            <div className="bb8_antenna"></div>
            <div className="bb8_head"></div>
          </div>
          <div className="bb8_body"></div>
          <div className="artificial-hidden">
            <div className="bb8_shadow"></div>
          </div>
        </div>
      </div>
    </label>
  );
};

export default ThemeToggle;
