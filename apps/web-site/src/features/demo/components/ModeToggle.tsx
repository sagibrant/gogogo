
interface ModeToggleProps {
  isAIMode: boolean;
  onToggle: () => void;
}

export default function ModeToggle({ isAIMode, onToggle }: ModeToggleProps) {
  return (
    <div className="mode-toggle-container">
      <div className="mode-toggle-label">
        <span className={!isAIMode ? 'active' : ''}>Code Mode</span>
        <div className="toggle-switch">
          <input
            type="checkbox"
            id="mode-toggle"
            checked={isAIMode}
            onChange={onToggle}
            className="toggle-input"
          />
          <label htmlFor="mode-toggle" className="toggle-label">
            <span className="toggle-slider"></span>
          </label>
        </div>
        <span className={isAIMode ? 'active' : ''}>AI Mode</span>
      </div>
    </div>
  );
};
