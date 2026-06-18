# 🎨 INSTRUCCIONES DE DISEÑO VISUAL — Sistema de Licorería
## Basado en el proyecto "Licorería Design System" de Stitch MCP

---

> **Para el agente que ejecute este plan:**
> Este documento contiene instrucciones EXACTAS y detalladas para transformar visualmente el sistema de licorería ubicado en `c:\sistema-de-licoreria`. El sistema ya está funcionando con backend y frontend. Tu tarea es aplicar el diseño visual Dark Mode Premium extraído del proyecto de Stitch MCP, SIN tocar ninguna lógica de negocio ni APIs.

---

## ⚠️ REGLAS IMPORTANTES ANTES DE EMPEZAR

1. **NUNCA modificar archivos en `/src/app/api/`** — son las APIs del backend, no tocar.
2. **NUNCA modificar `prisma/schema.prisma`** — es la base de datos, no tocar.
3. **NUNCA modificar `src/lib/`** — son las librerías del servidor, no tocar.
4. Solo modificar: `src/app/globals.css`, `src/components/*.js`, y los `page.js` del dashboard.
5. El proyecto usa **Next.js App Router** (versión 14+). NO usar `<style jsx>` — no funciona en App Router. Usar CSS inline o clases de `globals.css`.
6. El proyecto usa **CSS puro** (NO Tailwind). Aplicar todos los estilos via clases CSS definidas en `globals.css` o estilos inline en los componentes.

---

## 🎨 PASO 1 — REEMPLAZAR EL CSS GLOBAL COMPLETO

**Archivo:** `src/app/globals.css`

**Instrucción:** Reemplazar COMPLETAMENTE el contenido del archivo con el siguiente CSS. Este es el Design System extraído directamente del proyecto Stitch "Premium Spirits Management".

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

/* =====================================================
   DESIGN SYSTEM: PREMIUM SPIRITS MANAGEMENT
   Extraído de Stitch MCP - "Licorería Design System"
   Modo: DARK | Acento: Dorado #d4a853
   ===================================================== */

:root {
  /* === SUPERFICIES (de más oscuro a más claro) === */
  --surface-lowest:   #0d0e12;   /* Fondo del sidebar, inputs */
  --surface-dim:      #121317;   /* Fondo principal del body */
  --surface:          #121317;   /* Fondo base */
  --surface-low:      #1a1b1f;   /* Hover muy sutil */
  --surface-container:#1e1f23;   /* Paneles, tarjetas */
  --surface-high:     #292a2e;   /* Paneles elevados */
  --surface-highest:  #343539;   /* Tooltips, dropdowns */
  --surface-bright:   #38393d;   /* Bordes de separación visibles */

  /* === TEXTO === */
  --on-surface:         #e3e2e7;   /* Texto principal (blanco suave) */
  --on-surface-variant: #d2c5b2;   /* Texto secundario (beige dorado) */

  /* === DORADO — Color primario de marca === */
  --primary:            #f2c36b;   /* Texto dorado brillante */
  --primary-container:  #d4a853;   /* Botones primarios, badges activos */
  --on-primary:         #412d00;   /* Texto sobre botón dorado */
  --primary-dim:        #eec068;   /* Dorado hover */

  /* === BORDES === */
  --outline:         #9b8f7e;   /* Bordes visibles */
  --outline-variant: #4e4637;   /* Bordes sutiles */

  /* === SEMÁNTICOS === */
  --success:     #22c55e;
  --error:       #ffb4ab;
  --error-bg:    #93000a;
  --warning:     #d97706;

  /* === GLASSMORPHISM === */
  --glass-bg:     rgba(30, 31, 35, 0.6);
  --glass-blur:   blur(20px);
  --glass-border-top:   rgba(255, 255, 255, 0.1);
  --glass-border-right: rgba(0, 0, 0, 0.2);

  /* === LAYOUT === */
  --sidebar-width: 280px;
  --header-height: 64px;

  /* === SOMBRAS === */
  --shadow-sm:      0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md:      0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg:      0 10px 30px rgba(0, 0, 0, 0.5);
  --shadow-gold:    0 0 20px rgba(212, 168, 83, 0.15);
  --shadow-modal:   0 20px 60px rgba(0, 0, 0, 0.7);
}

/* =====================================================
   RESET Y BASE
   ===================================================== */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
}

html, body {
  background-color: var(--surface-dim);
  color: var(--on-surface);
  min-height: 100vh;
  overflow-x: hidden;
}

/* =====================================================
   SCROLLBAR DARK
   ===================================================== */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--surface-highest); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: var(--outline); }

/* =====================================================
   TIPOGRAFÍA
   Escala extraída del Design System de Stitch
   ===================================================== */
h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--on-surface);
}

/* display-lg: Para métricas grandes del dashboard ($12,450) */
.text-display-lg {
  font-size: 48px;
  line-height: 56px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* headline-lg: Títulos de sección */
.text-headline-lg {
  font-size: 32px;
  line-height: 40px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

/* title-md: Títulos de tarjetas */
.text-title-md {
  font-size: 20px;
  line-height: 28px;
  font-weight: 600;
}

/* body-lg: Texto general */
.text-body-lg {
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;
}

/* body-sm: Texto en tablas */
.text-body-sm {
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
}

/* label-caps: Labels de tablas, categorías */
.text-label-caps {
  font-size: 12px;
  line-height: 16px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* =====================================================
   GLASSMORPHISM — Panel base (el más importante)
   Extraído directamente del HTML de Stitch
   ===================================================== */
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-top: 1px solid var(--glass-border-top);
  border-left: 1px solid var(--glass-border-top);
  border-right: 1px solid var(--glass-border-right);
  border-bottom: 1px solid var(--glass-border-right);
  border-radius: 16px;
  transition: background 0.3s ease, border-color 0.3s ease;
}

.glass-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* Panel sin glassmorphism, solo fondo oscuro sólido */
.dark-panel {
  background: var(--surface-container);
  border: 1px solid var(--outline-variant);
  border-radius: 16px;
  padding: 24px;
}

/* =====================================================
   LAYOUT DEL DASHBOARD
   ===================================================== */
.dashboard-container {
  display: flex;
  min-height: 100vh;
}

.dashboard-content {
  flex-grow: 1;
  margin-left: var(--sidebar-width);
  padding-top: calc(var(--header-height) + 24px);
  padding-left: 24px;
  padding-right: 24px;
  padding-bottom: 32px;
  max-width: 1440px;
}

/* =====================================================
   GRILLA DE TARJETAS
   ===================================================== */
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }

@media (max-width: 1200px) {
  .grid-4 { grid-template-columns: repeat(2, 1fr); }
  .grid-3 { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .grid-4, .grid-3, .grid-2 { grid-template-columns: 1fr; }
  .dashboard-content { margin-left: 0; padding: 16px; }
}

/* =====================================================
   KPI WIDGET — Tarjeta de métrica del dashboard
   Diseñado según el HTML de Stitch
   Tiene barra vertical de color a la izquierda
   ===================================================== */
.kpi-card {
  position: relative;
  overflow: hidden;
  padding: 24px;
  border-radius: 16px;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-top: 1px solid var(--glass-border-top);
  border-left: 1px solid var(--glass-border-top);
  border-right: 1px solid var(--glass-border-right);
  border-bottom: 1px solid var(--glass-border-right);
  transition: all 0.3s ease;
}

.kpi-card:hover {
  background: rgba(255, 255, 255, 0.08);
  box-shadow: var(--shadow-gold);
}

/* La barra vertical de color a la izquierda */
.kpi-accent-bar {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 48px;
  border-radius: 0 4px 4px 0;
}

.kpi-accent-bar.gold  { background: var(--primary-container); }
.kpi-accent-bar.error { background: var(--error); }
.kpi-accent-bar.muted { background: rgba(212, 168, 83, 0.4); }

/* El icono de la tarjeta KPI (cuadrado redondeado en la esquina) */
.kpi-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.kpi-icon.gold  { background: rgba(212, 168, 83, 0.1); color: var(--primary); }
.kpi-icon.error { background: rgba(255, 180, 171, 0.1); color: var(--error); }
.kpi-icon.muted { background: var(--surface-high); color: var(--on-surface); }

/* Header de la KPI (label + icono en misma fila) */
.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

/* El número grande */
.kpi-value {
  font-size: 48px;
  line-height: 56px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--on-surface);
}

/* La tendencia debajo del número */
.kpi-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
  margin-top: 8px;
  color: var(--primary);
}

.kpi-trend.negative { color: var(--error); }
.kpi-trend.neutral  { color: var(--on-surface-variant); }

/* =====================================================
   SIDEBAR DARK PREMIUM
   ===================================================== */
.sidebar {
  width: var(--sidebar-width);
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background: rgba(13, 14, 18, 0.8);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  z-index: 100;
  padding: 24px 0;
}

.sidebar-brand {
  padding: 0 24px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.sidebar-brand h1 {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: -0.02em;
}

.sidebar-brand p {
  font-size: 12px;
  color: rgba(210, 197, 178, 0.7);
  margin-top: 2px;
}

.sidebar-user {
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar-user-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--on-surface);
}

.sidebar-user-role {
  font-size: 11px;
  color: var(--on-surface-variant);
}

.sidebar-nav {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* Ocultar scrollbar del sidebar */
.sidebar-nav::-webkit-scrollbar { width: 0; }

/* Link del menú */
.menu-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  color: var(--on-surface-variant);
  text-decoration: none;
  font-size: 15px;
  font-weight: 400;
  transition: all 0.2s ease;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.menu-link:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--on-surface);
}

/* Estado ACTIVO: borde derecho dorado + fondo sutil */
.menu-link.active {
  background: rgba(255, 255, 255, 0.05);
  color: var(--primary);
  font-weight: 700;
  border-right: 2px solid var(--primary);
}

.menu-link.logout {
  color: var(--error);
}
.menu-link.logout:hover {
  background: rgba(255, 180, 171, 0.08);
}

/* Botón "Nuevo Pedido" del sidebar */
.sidebar-action-btn {
  margin: 16px 8px 0;
  width: calc(100% - 16px);
  padding: 12px;
  background: var(--primary-container);
  color: var(--on-primary);
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}
.sidebar-action-btn:hover {
  box-shadow: var(--shadow-gold);
  opacity: 0.9;
  transform: translateY(-1px);
}

/* =====================================================
   HEADER FIJO (barra superior del dashboard)
   ===================================================== */
.dashboard-header {
  position: fixed;
  top: 0;
  right: 0;
  width: calc(100% - var(--sidebar-width));
  height: var(--header-height);
  background: rgba(18, 19, 23, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  z-index: 50;
}

/* Barra de búsqueda del header */
.header-search {
  display: flex;
  align-items: center;
  background: var(--surface-lowest);
  padding: 8px 16px;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  width: 360px;
  gap: 8px;
}

.header-search input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--on-surface);
  font-size: 14px;
  width: 100%;
}

.header-search input::placeholder {
  color: rgba(210, 197, 178, 0.5);
}

/* =====================================================
   BOTONES
   ===================================================== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  text-decoration: none;
}

/* Botón primario: dorado sólido */
.btn-primary {
  background: var(--primary-container);
  color: var(--on-primary);
}
.btn-primary:hover {
  box-shadow: var(--shadow-gold);
  transform: translateY(-1px);
  opacity: 0.95;
}

/* Botón secundario: borde dorado sobre fondo glass */
.btn-secondary {
  background: transparent;
  color: var(--primary);
  border: 1px solid rgba(212, 168, 83, 0.3);
}
.btn-secondary:hover {
  background: rgba(212, 168, 83, 0.05);
  border-color: var(--primary);
}

/* Botón de peligro: rojo */
.btn-danger {
  background: rgba(147, 0, 10, 0.8);
  color: var(--error);
  border: 1px solid var(--error-bg);
}
.btn-danger:hover {
  background: var(--error-bg);
  transform: translateY(-1px);
}

/* Botón de éxito: verde */
.btn-success {
  background: rgba(34, 197, 94, 0.15);
  color: var(--success);
  border: 1px solid rgba(34, 197, 94, 0.3);
}
.btn-success:hover {
  background: rgba(34, 197, 94, 0.25);
}

/* Botón grande (para el POS - "COBRAR") */
.btn-xl {
  padding: 18px 32px;
  font-size: 18px;
  font-weight: 800;
  border-radius: 12px;
  width: 100%;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* =====================================================
   INPUTS Y FORMULARIOS
   ===================================================== */
.input-field {
  width: 100%;
  padding: 12px 16px;
  background: var(--surface-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: 8px;
  color: var(--on-surface);
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
}

.input-field:focus {
  border-color: var(--primary-container);
  box-shadow: 0 0 0 3px rgba(212, 168, 83, 0.15);
}

.input-field::placeholder {
  color: rgba(210, 197, 178, 0.4);
}

/* Label de campo */
.label-field {
  display: block;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--on-surface-variant);
  margin-bottom: 8px;
}

/* Select (dropdown) */
select.input-field {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23d2c5b2' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

/* =====================================================
   TABLAS
   ===================================================== */
.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid var(--outline-variant);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

/* Encabezado oscuro con texto dorado en caps */
.data-table thead tr {
  background: var(--surface-lowest);
  border-bottom: 1px solid var(--outline-variant);
}

.data-table thead th {
  padding: 14px 16px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--on-surface-variant);
  white-space: nowrap;
}

/* Filas */
.data-table tbody td {
  padding: 14px 16px;
  font-size: 14px;
  color: var(--on-surface);
  border-bottom: 1px solid rgba(78, 70, 55, 0.15);
  background: transparent;
  transition: background 0.15s ease;
}

/* Hover en filas */
.data-table tbody tr:hover td {
  background: rgba(255, 255, 255, 0.03);
}

/* Última fila sin borde */
.data-table tbody tr:last-child td {
  border-bottom: none;
}

/* =====================================================
   BADGES DE ESTADO
   ===================================================== */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.badge-success {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.badge-error {
  background: rgba(255, 180, 171, 0.1);
  color: var(--error);
  border: 1px solid rgba(255, 180, 171, 0.2);
}

.badge-warning {
  background: rgba(217, 119, 6, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(217, 119, 6, 0.25);
}

.badge-gold {
  background: rgba(212, 168, 83, 0.15);
  color: var(--primary);
  border: 1px solid rgba(212, 168, 83, 0.3);
}

.badge-muted {
  background: var(--surface-high);
  color: var(--on-surface-variant);
  border: 1px solid var(--outline-variant);
}

/* Badge pulsante (stock crítico) */
.badge-pulse {
  animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 180, 171, 0.4); }
  50%       { box-shadow: 0 0 0 6px rgba(255, 180, 171, 0); }
}

/* =====================================================
   MODAL
   ===================================================== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-panel {
  background: rgba(30, 31, 35, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  border-right: 1px solid rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  padding: 32px;
  width: 90%;
  max-width: 560px;
  box-shadow: var(--shadow-modal);
  animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--outline-variant);
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--on-surface);
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--surface-high);
  border: none;
  color: var(--on-surface-variant);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.modal-close:hover {
  background: rgba(255, 180, 171, 0.1);
  color: var(--error);
}

/* =====================================================
   PUNTO DE VENTA (POS) — LAYOUT ESPECIAL
   ===================================================== */
.pos-container {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
  height: calc(100vh - var(--header-height));
  overflow: hidden;
}

/* Panel izquierdo: productos */
.pos-products-panel {
  overflow-y: auto;
  padding-bottom: 24px;
}

/* Panel derecho: carrito (fijo, no hace scroll) */
.pos-cart-panel {
  background: rgba(13, 14, 18, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-left: 1px solid var(--outline-variant);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px;
}

/* Barra de búsqueda del POS */
.pos-search-bar {
  display: flex;
  align-items: center;
  background: var(--surface-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: 12px;
  padding: 14px 20px;
  gap: 12px;
  margin-bottom: 20px;
  transition: border-color 0.2s ease;
}
.pos-search-bar:focus-within {
  border-color: var(--primary-container);
  box-shadow: 0 0 0 3px rgba(212, 168, 83, 0.1);
}
.pos-search-bar input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--on-surface);
  font-size: 16px;
  width: 100%;
}
.pos-search-bar input::placeholder {
  color: rgba(210, 197, 178, 0.4);
}

/* Chips de categoría del POS */
.pos-category-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 12px;
  margin-bottom: 16px;
  scrollbar-width: none;
}
.pos-category-chips::-webkit-scrollbar { display: none; }

.category-chip {
  padding: 6px 16px;
  border-radius: 9999px;
  border: 1px solid var(--outline-variant);
  background: transparent;
  color: var(--on-surface-variant);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.category-chip:hover { border-color: var(--outline); color: var(--on-surface); }
.category-chip.active {
  background: var(--primary-container);
  color: var(--on-primary);
  border-color: var(--primary-container);
  font-weight: 700;
}

/* Tarjeta de producto en el POS */
.pos-product-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-top: 1px solid var(--glass-border-top);
  border-left: 1px solid var(--glass-border-top);
  border-right: 1px solid var(--glass-border-right);
  border-bottom: 1px solid var(--glass-border-right);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
}
.pos-product-card:hover {
  transform: scale(1.02) translateY(-2px);
  border-color: rgba(212, 168, 83, 0.4);
  box-shadow: var(--shadow-gold);
}
.pos-product-card:active {
  transform: scale(0.98);
}

/* Badge de stock en la esquina de la tarjeta de producto */
.pos-stock-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(13, 14, 18, 0.8);
  color: var(--on-surface-variant);
  padding: 3px 8px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 700;
  backdrop-filter: blur(4px);
}

/* Lista de items del carrito */
.cart-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(78, 70, 55, 0.2);
  transition: all 0.2s ease;
}

/* Botón COBRAR (grande, dorado, con glow) */
.checkout-btn {
  margin-top: auto;
  padding: 18px;
  background: var(--primary-container);
  color: var(--on-primary);
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 800;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s ease;
  box-shadow: 0 8px 24px rgba(212, 168, 83, 0.3);
}
.checkout-btn:hover {
  box-shadow: 0 12px 32px rgba(212, 168, 83, 0.45);
  transform: translateY(-2px);
}
.checkout-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* =====================================================
   ANIMATIONS
   ===================================================== */
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-up {
  animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* =====================================================
   RECEIPT / TICKET DE COMPRA
   ===================================================== */
.paper-receipt {
  font-family: 'Courier New', monospace;
  background: #1a1b1f;
  color: var(--on-surface);
  border: 1px solid var(--outline-variant);
  border-radius: 12px;
  padding: 24px;
  max-width: 380px;
  margin: 0 auto;
}

.receipt-divider {
  border: none;
  border-top: 1px dashed var(--outline-variant);
  margin: 12px 0;
}

/* =====================================================
   GRÁFICAS (Chart.js tema dark)
   ===================================================== */
.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}

/* =====================================================
   NOTIFICACIÓN / ALERTA INLINE
   ===================================================== */
.alert-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
}
.alert-banner.error {
  background: rgba(147, 0, 10, 0.2);
  border: 1px solid rgba(255, 180, 171, 0.2);
  color: var(--error);
}
.alert-banner.warning {
  background: rgba(217, 119, 6, 0.15);
  border: 1px solid rgba(217, 119, 6, 0.25);
  color: #fbbf24;
}
.alert-banner.success {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: var(--success);
}

/* =====================================================
   INDICADOR DE CAJA (punto verde/rojo fijo)
   ===================================================== */
.caja-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
}
.caja-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.caja-dot.open   { background: var(--success); box-shadow: 0 0 8px var(--success); }
.caja-dot.closed { background: var(--error); box-shadow: 0 0 8px var(--error); }

/* =====================================================
   TOGGLE SWITCH
   ===================================================== */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: var(--surface-highest);
  border-radius: 24px;
  transition: 0.3s;
}
.toggle-slider::before {
  content: '';
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: var(--on-surface-variant);
  border-radius: 50%;
  transition: 0.3s;
}
input:checked + .toggle-slider { background: var(--primary-container); }
input:checked + .toggle-slider::before {
  transform: translateX(20px);
  background: white;
}

/* =====================================================
   SEPARADORES Y MISCELÁNEOS
   ===================================================== */
.divider {
  border: none;
  border-top: 1px solid var(--outline-variant);
  margin: 16px 0;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--on-surface);
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--on-surface-variant);
  margin-bottom: 24px;
}

/* Chip de acceso rápido (shortcuts en el POS) */
.shortcut-chip {
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--surface-high);
  color: var(--on-surface-variant);
  font-size: 11px;
  font-weight: 600;
  font-family: monospace;
}
```

---

## 🔧 PASO 2 — CORREGIR EL SIDEBAR

**Archivo:** `src/components/Sidebar.js`

**Problema:** El componente usa `<style jsx>` que NO funciona en Next.js App Router. Los estilos no se aplican.

**Solución:** Eliminar el bloque `<style jsx>{...}</style>` al final del componente y reemplazar los nombres de clase por los definidos en `globals.css`. El resultado debe ser:

```jsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Home, ShoppingCart, Package, Tag, Box, Percent,
  History, Truck, Building2, Users, CreditCard, Undo,
  Calculator, BarChart3, ShieldAlert, User, Settings, LogOut
} from 'lucide-react';

const MENU_ITEMS = [
  { label: 'Inicio',             path: '/dashboard',                     icon: Home,        permKey: 'inicio' },
  { label: 'Punto de Venta',     path: '/dashboard/pos',                 icon: ShoppingCart, permKey: 'pos' },
  { label: 'Inventario',         path: '/dashboard/inventario',          icon: Package,     permKey: 'inventario' },
  { label: 'Categorías',         path: '/dashboard/categorias',          icon: Tag,         permKey: 'categorias' },
  { label: 'Combos',             path: '/dashboard/combos',              icon: Box,         permKey: 'combos' },
  { label: 'Descuentos',         path: '/dashboard/descuentos',          icon: Percent,     permKey: 'descuentos' },
  { label: 'Ventas',             path: '/dashboard/ventas',              icon: History,     permKey: 'ventas' },
  { label: 'Compras',            path: '/dashboard/compras',             icon: Truck,       permKey: 'compras' },
  { label: 'Proveedores',        path: '/dashboard/proveedores',         icon: Building2,   permKey: 'proveedores' },
  { label: 'Clientes',           path: '/dashboard/clientes',            icon: Users,       permKey: 'clientes' },
  { label: 'Cuentas x Cobrar',   path: '/dashboard/cuentas-por-cobrar', icon: CreditCard,  permKey: 'creditos' },
  { label: 'Devoluciones',       path: '/dashboard/devoluciones',        icon: Undo,        permKey: 'devoluciones' },
  { label: 'Caja',               path: '/dashboard/caja',               icon: Calculator,  permKey: 'caja' },
  { label: 'Reportes',           path: '/dashboard/reportes',            icon: BarChart3,   permKey: 'reportes' },
  { label: 'Auditoría',          path: '/dashboard/auditoria',           icon: ShieldAlert, permKey: 'auditoria' },
  { label: 'Usuarios',           path: '/dashboard/usuarios',            icon: User,        permKey: 'usuarios' },
  { label: 'Configuración',      path: '/dashboard/configuracion',       icon: Settings,    permKey: 'configuracion' },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const permisos = session?.user?.rol?.permisos || {};
  const nombreNegocio = 'Mi Licorería'; // Después se puede traer de configuración

  return (
    <aside className="sidebar">
      {/* Marca */}
      <div className="sidebar-brand">
        <h1>{nombreNegocio}</h1>
        <p>Management Suite</p>
      </div>

      {/* Info del usuario */}
      <div className="sidebar-user">
        <div>
          <div className="sidebar-user-name">{session?.user?.name}</div>
          <div className="sidebar-user-role">{session?.user?.rol?.nombre}</div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="sidebar-nav">
        {MENU_ITEMS.map((item) => {
          if (!permisos[item.permKey]) return null;
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
          return (
            <Link key={item.path} href={item.path} className={`menu-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Acciones inferiores */}
      <div style={{ padding: '0 8px 8px' }}>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="menu-link logout">
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
```

---

## 📊 PASO 3 — ACTUALIZAR EL HEADER DEL DASHBOARD

**Archivo:** `src/components/Header.js`

Reemplazar el contenido por este componente que usa las clases dark del globals.css:

```jsx
'use client';

import { useSession } from 'next-auth/react';
import { Bell, Search } from 'lucide-react';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="dashboard-header">
      {/* Buscador */}
      <div className="header-search">
        <Search size={16} color="var(--on-surface-variant)" />
        <input placeholder="Buscar productos, ventas o clientes..." />
      </div>

      {/* Lado derecho: notificaciones + usuario */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', position: 'relative' }}>
          <Bell size={20} />
          <span style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%' }} />
        </button>

        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--on-surface)' }}>{session?.user?.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>{session?.user?.rol?.nombre}</div>
          </div>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-primary)', fontWeight: 700, fontSize: '14px', border: '2px solid rgba(212,168,83,0.3)' }}>
            {session?.user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
        </div>
      </div>
    </header>
  );
}
```

---

## 📈 PASO 4 — ACTUALIZAR CHART.JS AL TEMA DARK

**Archivo:** `src/components/Charts.js`

Los colores del eje, grid y tooltips de Chart.js deben cambiarse al tema oscuro. En todas las configuraciones de Chart.js, usar estas opciones globales:

```js
// Opciones base dark para todas las gráficas
export const darkChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#d2c5b2',           // --on-surface-variant
        font: { family: 'Inter', size: 13 }
      }
    },
    tooltip: {
      backgroundColor: '#292a2e',   // --surface-high
      titleColor: '#e3e2e7',        // --on-surface
      bodyColor: '#d2c5b2',         // --on-surface-variant
      borderColor: '#4e4637',       // --outline-variant
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
    }
  },
  scales: {
    x: {
      grid: { color: 'rgba(78, 70, 55, 0.2)' },    // --outline-variant sutil
      ticks: { color: '#9b8f7e' }                   // --outline
    },
    y: {
      grid: { color: 'rgba(78, 70, 55, 0.2)' },
      ticks: { color: '#9b8f7e' }
    }
  }
};

// Color de la línea de ventas (dorado)
export const goldDataset = (label, data) => ({
  label,
  data,
  borderColor: '#f2c36b',
  backgroundColor: 'rgba(212, 168, 83, 0.1)',
  borderWidth: 2,
  pointBackgroundColor: '#d4a853',
  pointRadius: 4,
  fill: true,
  tension: 0.4,
});
```

---

## 🔐 PASO 5 — ACTUALIZAR LA PÁGINA DE LOGIN

**Archivo:** `src/app/login/page.js`

La pantalla de login debe verse premium en dark mode. El fondo es oscuro con un formulario centrado glassmorphism. Asegurarse de que:
- El `<body>` / contenedor principal tenga `background: var(--surface-dim)` (`#121317`)
- El formulario use la clase `glass-card` con `padding: 40px`
- Los inputs usen la clase `input-field` (ya definida en globals.css en dark)
- El botón use `btn btn-primary` con texto "Iniciar Sesión"
- El título del negocio en dorado (`color: var(--primary)`)

---

## ✅ PASO 6 — VERIFICACIÓN FINAL

Después de aplicar todos los cambios, verificar:

1. **`npm run dev`** corre sin errores en la terminal
2. Abrir `http://localhost:3000` en el navegador
3. La pantalla de login debe ser **OSCURA** con formulario glassmorphism
4. Después de login, el sidebar debe ser **OSCURO** con texto dorado en el item activo
5. El dashboard debe mostrar tarjetas KPI oscuras con barra de color a la izquierda
6. Las tablas deben tener **header oscuro** con texto en caps
7. Los botones principales deben ser **DORADOS** con glow al hover
8. Los modales deben ser **OSCUROS** con blur de fondo
9. Abrir la consola del navegador (F12) y verificar que no haya errores de CSS

---

## 📌 REFERENCIA RÁPIDA DE COLORES

| Para usar como... | Variable CSS | Valor hex |
|---|---|---|
| Fondo de la app | `var(--surface-dim)` | `#121317` |
| Panel/tarjeta | `var(--surface-container)` | `#1e1f23` |
| Fondo del sidebar | `var(--surface-lowest)` | `#0d0e12` |
| Texto principal | `var(--on-surface)` | `#e3e2e7` |
| Texto secundario | `var(--on-surface-variant)` | `#d2c5b2` |
| Dorado (texto) | `var(--primary)` | `#f2c36b` |
| Dorado (botones) | `var(--primary-container)` | `#d4a853` |
| Borde visible | `var(--outline)` | `#9b8f7e` |
| Borde sutil | `var(--outline-variant)` | `#4e4637` |
| Error/rojo | `var(--error)` | `#ffb4ab` |
| Éxito/verde | `var(--success)` | `#22c55e` |
