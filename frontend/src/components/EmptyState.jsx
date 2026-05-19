/**
 * EmptyState — Universal "no data yet" panel used across all dashboard pages.
 *
 * Designed for the post-reset world: data will arrive once the logbook
 * integration goes live. Keep the visual quiet, brand-aligned, no decoration.
 */
const EmptyState = ({
  icon: Icon,
  title = "No data yet",
  message = "Your data will appear here once it has been logged.",
  action,
  compact = false,
  "data-testid": testId,
}) => {
  return (
    <div
      data-testid={testId || "empty-state"}
      className={
        "flex flex-col items-center justify-center text-center bg-white border border-dhl-border rounded-sm " +
        (compact ? "py-8 px-6" : "py-16 px-8")
      }
    >
      {Icon && (
        <span className="w-12 h-12 rounded-full bg-dhl-panel flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-dhl-muted" strokeWidth={1.5} />
        </span>
      )}
      <h3 className="font-display font-bold text-base text-dhl-ink mb-2">
        {title}
      </h3>
      <p className="text-sm text-dhl-muted max-w-md mb-4">{message}</p>
      {action}
    </div>
  );
};

export default EmptyState;
