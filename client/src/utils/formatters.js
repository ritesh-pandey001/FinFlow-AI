export function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return '₹' + num.toLocaleString('en-IN');
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function getEscalationBadgeClass(stageId) {
  const map = {
    friendly: 'badge-cyan',
    polite: 'badge-purple',
    formal: 'badge-amber',
    urgent: 'badge-orange',
    legal: 'badge-red'
  };
  return map[stageId] || 'badge-cyan';
}

export function getEscalationColor(stageId) {
  const map = {
    friendly: '#22d3ee',
    polite: '#a78bfa',
    formal: '#f59e0b',
    urgent: '#f97316',
    legal: '#ef4444'
  };
  return map[stageId] || '#22d3ee';
}

export function truncateText(text, maxLen = 100) {
  if (!text || text.length <= maxLen) return text;
  return text.substring(0, maxLen) + '...';
}
