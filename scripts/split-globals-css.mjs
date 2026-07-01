import fs from 'fs';
import path from 'path';

const root = path.resolve('src');
const src = fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8');
const lines = src.split(/\r?\n/);

const mapping = [
  { dir: '', file: 'tokens.css', from: 'Bodega operativa', until: 'Dashboard: scroll' },
  { dir: '', file: 'base.css', from: 'Dashboard: scroll', until: 'Panels' },
  { dir: 'components', file: 'panels.css', from: 'Panels', until: 'Forms' },
  { dir: 'components', file: 'forms.css', from: 'Forms', until: 'Buttons' },
  { dir: 'components', file: 'buttons.css', from: 'Buttons', until: 'Badges & status' },
  { dir: 'components', file: 'badges.css', from: 'Badges & status', until: 'Stat cards' },
  { dir: 'components', file: 'stat-cards.css', from: 'Stat cards', until: 'Empty & loading' },
  { dir: 'components', file: 'loading.css', from: 'Empty & loading', until: 'Page header' },
  { dir: 'layout', file: 'dashboard.css', from: 'Page header', until: 'Sidebar — columna' },
  { dir: 'components', file: 'tables.css', from: 'Tables', until: 'Dashboard layout' },
  { dir: 'layout', file: 'shell.css', from: 'Dashboard layout', until: 'Formularios en modales' },
  { dir: 'layout', file: 'sidebar.css', from: 'Sidebar — columna', until: 'Toolbars & filters' },
  { dir: 'components', file: 'toolbars.css', from: 'Toolbars & filters', until: 'Report stat boxes' },
  { dir: 'components', file: 'reports-stats.css', from: 'Report stat boxes', until: 'Alerts' },
  { dir: 'components', file: 'alerts.css', from: 'Alerts', until: 'Animations' },
  { dir: 'components', file: 'animations.css', from: 'Animations', until: 'Metric cards (legacy' },
  { dir: 'components', file: 'charts.css', from: 'Chart panels', until: 'Modal drilldown' },
  { dir: 'components', file: 'drilldown.css', from: 'Modal drilldown', until: 'Settings' },
  { dir: 'components', file: 'settings.css', from: 'Settings', until: 'Toggles' },
  { dir: 'components', file: 'toggles.css', from: 'Toggles', until: 'Utility' },
  { dir: 'components', file: 'utilities.css', from: 'Utility', until: '── Modal' },
  { dir: 'components', file: 'modals.css', from: '── Modal', until: '── Module states' },
  { dir: 'components', file: 'module-states.css', from: '── Module states', until: '── Module toolbar' },
  { dir: 'components', file: 'module-toolbar.css', from: '── Module toolbar', until: '── Caja' },
  { dir: 'modules', file: 'compras.css', from: 'Compras / entradas', until: 'Selector de producto' },
  { dir: 'components', file: 'product-picker.css', from: 'Selector de producto', until: '── Caja' },
  { dir: 'modules', file: 'caja.css', from: '── Caja', until: '── Config' },
  { dir: 'modules', file: 'config.css', from: '── Config', until: '── POS shell' },
  { dir: 'modules', file: 'pos-shell.css', from: '── POS shell', until: '── Auditoría' },
  { dir: 'modules', file: 'auditoria.css', from: '── Auditoría', until: '── Inventario' },
  { dir: 'modules', file: 'inventario.css', from: '── Inventario', until: 'Responsive' },
  { dir: '', file: 'responsive.css', from: 'Responsive', until: null },
];

function findLine(prefix) {
  if (!prefix) return lines.length;
  const idx = lines.findIndex((l) => l.includes(prefix));
  if (idx === -1) throw new Error(`Marker not found: ${prefix}`);
  return idx;
}

const stylesDir = path.join(root, 'styles');
fs.mkdirSync(stylesDir, { recursive: true });

const imports = [];

for (const m of mapping) {
  const start = findLine(m.from);
  const end = m.until ? findLine(m.until) : lines.length;
  const chunk = lines.slice(start, end).join('\n').trim() + '\n';
  const dir = m.dir ? path.join(stylesDir, m.dir) : stylesDir;
  fs.mkdirSync(dir, { recursive: true });
  const outPath = path.join(dir, m.file);
  fs.writeFileSync(outPath, chunk);
  const rel = path.relative(path.join(root, 'app'), outPath).replace(/\\/g, '/');
  imports.push(`@import '../${rel}';`);
}

const index = `/* Evaluna design system — modular entry */\n${imports.join('\n')}\n`;
fs.writeFileSync(path.join(root, 'app/globals.css'), index);
console.log('Split into', mapping.length, 'files');
