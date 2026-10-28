export const dismissProps = (onDismiss) => ({
  onBlur: (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) onDismiss(false);
  },
  onKeyDown: (event) => {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    onDismiss(true);
  },
});

export const escapeProps = (onEscape) => ({
  onKeyDown: (event) => {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    onEscape();
  },
});
