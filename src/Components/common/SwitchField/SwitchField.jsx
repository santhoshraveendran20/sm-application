import "./switchfield.css";

function SwitchField({ checked, onChange, children, className = "" }) {
  return (
    <label className={`switch ${className}`}>
      <input type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="switch-track" aria-hidden="true">
        <span className="switch-thumb" />
      </span>
      <span>{children}</span>
    </label>
  );
}

export default SwitchField;
