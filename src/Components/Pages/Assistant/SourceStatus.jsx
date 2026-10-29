import { useState } from "react";
import { dismissProps } from "../../common/dismissProps.js";

const GROUPS = [
  { title: "System", items: [{ id: "api", name: "API server" }] },
  {
    title: "Data sources",
    items: [
      { id: "commercial", name: "Commercial" },
      { id: "memcot", name: "memCOT" },
      { id: "salesforce", name: "Salesforce" },
    ],
  },
  { title: "AI model", items: [{ id: "bedrock", name: "Amazon Bedrock" }] },
];

function SourceStatus() {
  const [open, setOpen] = useState(false);

  return (
    <div className="as-sources" {...(open ? dismissProps(setOpen) : {})}>
      <button type="button" className="as-status" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(!open)}>
        <i aria-hidden="true" />
        All sources online
      </button>
      {open && (
        <div className="as-sources-panel" role="dialog" aria-label="Connected sources">
          {GROUPS.map((group) => (
            <section key={group.title} className="as-sources-group">
              <h3>{group.title}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item.id}>
                    <i aria-hidden="true" />
                    <span>{item.name}</span>
                    <b>Online</b>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default SourceStatus;
