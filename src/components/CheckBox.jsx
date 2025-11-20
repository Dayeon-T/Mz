import "./CheckBox.css";
import O from "../assets/O.svg?react";
import X from "../assets/X.svg?react";

export default function CheckBox({
  label,
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span className="slider round"></span>
    </label>
  );
}
