export function getStageByLevel(level) {
  if (!level) return "fundamental";

  const map = {
    "1": "fundamental1",
    "2": "fundamental1",
    "3": "fundamental1",
    "4": "fundamental1",
    "5": "fundamental1",
    "6": "fundamental2",
    "7": "fundamental2",
    "8": "fundamental2",
    "9": "fundamental2",
  };

  return map[level] || "fundamental";
}