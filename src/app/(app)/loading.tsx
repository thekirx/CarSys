export default function Loading() {
  return <div className="loading-grid" aria-label="Loading page"><div className="skeleton skeleton-hero" /><div className="skeleton-grid">{Array.from({ length: 4 }).map((_, index) => <div className="skeleton skeleton-card" key={index} />)}</div><div className="skeleton skeleton-panel" /></div>;
}
