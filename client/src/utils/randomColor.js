const PALETTE = ['#7CFFB2', '#5EEAD4', '#8B9DFF', '#F5A97F', '#F58CBA', '#FFD166'];

export function colorForId(id) {
  const idx = Array.from(String(id)).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % PALETTE.length;
  return PALETTE[idx];
}
