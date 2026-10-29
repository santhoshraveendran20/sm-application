import SelectField from "../../../common/SelectField/SelectField.jsx";
import MultiSelectField from "../../../common/MultiSelectField/MultiSelectField.jsx";
import { PRODUCTS, STATE_OPTIONS } from "../../Leakage/leakageData.js";
import { RANGE_OPTIONS } from "../dashboardData.js";

function DashboardFilters({ filters, onChange }) {
  return (
    <div className="dash-filters">
      <div className="field dash-filter">
        <label htmlFor="dash-range" className="field-label">
          Date range
        </label>
        <SelectField id="dash-range" value={filters.range} onChange={(event) => onChange({ ...filters, range: event.target.value })}>
          {RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="field dash-filter">
        <span className="field-label">Product</span>
        <MultiSelectField
          id="dash-product"
          label="Product"
          allLabel="All products"
          searchPlaceholder="Search products"
          options={PRODUCTS}
          value={filters.product}
          onChange={(product) => onChange({ ...filters, product })}
        />
      </div>
      <div className="field dash-filter">
        <span className="field-label">State</span>
        <MultiSelectField
          id="dash-state"
          label="State"
          allLabel="All states"
          searchPlaceholder="Search states"
          options={STATE_OPTIONS}
          value={filters.state}
          onChange={(state) => onChange({ ...filters, state })}
        />
      </div>
    </div>
  );
}

export default DashboardFilters;
