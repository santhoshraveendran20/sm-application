import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import "./selectfield.css";

const SelectField = forwardRef(function SelectField({ className = "", invalid = false, children, ...props }, ref) {
  return (
    <div className={`select-field ${className}`}>
      <select ref={ref} className={`input select-input ${invalid ? "is-invalid" : ""}`} {...props}>
        {children}
      </select>
      <ChevronDown className="select-chevron" size={16} aria-hidden="true" />
    </div>
  );
});

export default SelectField;
