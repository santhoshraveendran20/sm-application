export const niceStep = (raw) => {
  if (raw <= 0) return 1;
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const fraction = raw / power;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * power;
};

export const buildTicks = (max, count = 4) => {
  const step = niceStep(max / count);
  const top = Math.max(step, Math.ceil(max / step) * step);
  const ticks = [];
  for (let value = 0; value <= top + step / 1000; value += step) ticks.push(value);
  return { ticks, top };
};

export const wrapLabel = (label, limit = 14) => {
  if (label.length <= limit) return [label];
  const cut = label.lastIndexOf(" ", limit);
  if (cut <= 0) return [label];
  return [label.slice(0, cut), label.slice(cut + 1)];
};

export const safeId = (raw) => raw.replace(/[^a-zA-Z0-9]/g, "");
