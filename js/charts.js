/* Lightweight chart rendering with canvas */
window.renderBarCharts = () => {
  const charts = document.querySelectorAll('[data-chart]');
  charts.forEach((canvas) => {
    const ctx = canvas.getContext('2d');
    const value = Number(canvas.dataset.chart || 0);
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, height - 24, width, 24);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(0, height - 24, (width * value) / 100, 24);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 20px Inter, sans-serif';
    ctx.fillText(`${value}%`, 12, height - 40);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.renderBarCharts);
} else {
  window.renderBarCharts();
}
