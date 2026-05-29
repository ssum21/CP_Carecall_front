export const riskOrder = { 위험: 3, 주의: 2, 정상: 1 };

export function sortByType(data, sortType, getStatus, getRisk, getName = r => r.name || r.recipientName || '') {
  return [...data].sort((a, b) => {
    const nameCompare = getName(a).localeCompare(getName(b), 'ko');

    if (sortType === 'default') return nameCompare;

    const aResponded = getStatus(a);
    const bResponded = getStatus(b);
    const aRisk = riskOrder[getRisk(a)] || 0;
    const bRisk = riskOrder[getRisk(b)] || 0;

    if (sortType === 'response') {
      if (aResponded !== bResponded) return aResponded ? 1 : -1;
      return nameCompare;
    }

    if (sortType === 'risk') {
      if (bRisk !== aRisk) return bRisk - aRisk;
      return nameCompare;
    }

    return nameCompare;
  });
}