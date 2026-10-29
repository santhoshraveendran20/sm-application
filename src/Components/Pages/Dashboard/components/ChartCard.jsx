function ChartCard({ icon: Icon, title, description, actions, className = "", children }) {
  return (
    <section className={`dash-card ${className}`} aria-label={title}>
      <header className="dash-card-head">
        <div className="dash-card-text">
          <h2 className="dash-card-title">
            {Icon && <Icon size={16} aria-hidden="true" />}
            {title}
          </h2>
          {description && <p className="dash-card-desc">{description}</p>}
        </div>
        {actions && <div className="dash-card-actions">{actions}</div>}
      </header>
      {children}
    </section>
  );
}

export default ChartCard;
