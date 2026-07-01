'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DashboardModule } from '@/components/layout';
import {
  AuditoriaPanel,
  UsuariosPanel,
  AppearanceSettings,
  PaymentMethodsPanel,
  ConfigSectionLayout,
  BusinessTicketPreview,
  InvoicePreview,
  InventoryAlertPreview,
  PaymentMethodsPreview,
} from '@/components/config';
import { applyPreset } from '@/lib/theme';
import {
  Save,
  CheckCircle,
  AlertTriangle,
  Building2,
  Receipt,
  Package,
  Palette,
  User,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import { useConfig } from '@/components/ConfigProvider';
import { LoadingState } from '@/components/ui';
import Button from '@/components/ui/Button';
import { parsePaymentMethods, serializePaymentMethods } from '@/lib/paymentMethods';

const ALL_TABS = [
  { id: 'negocio', label: 'Datos del negocio', icon: Building2, permKey: 'configuracion', group: 'settings' },
  { id: 'facturacion', label: 'Facturación', icon: Receipt, permKey: 'configuracion', group: 'settings' },
  { id: 'pagos', label: 'Métodos de pago', icon: Wallet, permKey: 'configuracion', group: 'settings' },
  { id: 'inventario', label: 'Inventario', icon: Package, permKey: 'configuracion', group: 'settings' },
  { id: 'apariencia', label: 'Apariencia', icon: Palette, permKey: 'configuracion', group: 'settings' },
  { id: 'usuarios', label: 'Usuarios', icon: User, permKey: 'usuarios', group: 'admin' },
  { id: 'auditoria', label: 'Auditoría', icon: ShieldAlert, permKey: 'auditoria', group: 'admin' },
];

const TAB_INTRO = {
  negocio: 'Datos legales y de contacto del establecimiento.',
  facturacion: 'Moneda, impuestos y numeración de facturas.',
  pagos: 'Formas de pago disponibles en POS, caja y abonos.',
  inventario: 'Alertas y parámetros de stock.',
  apariencia: 'Estilos, colores, botones y apariencia del sistema.',
  usuarios: 'Quién tiene acceso y qué puede hacer en el sistema.',
  auditoria: 'Registro de cambios y actividad en el sistema.',
};

function ConfiguracionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { updateConfigState } = useConfig();
  const [loading, setLoading] = useState(true);

  const [nombreNegocio, setNombreNegocio] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rifNit, setRifNit] = useState('');
  const [monedaSimbolo, setMonedaSimbolo] = useState('');
  const [impuestoPorcentaje, setImpuestoPorcentaje] = useState('');
  const [prefijoFactura, setPrefijoFactura] = useState('');
  const [siguienteNumFactura, setSiguienteNumFactura] = useState('');
  const [diasAlertaVencimiento, setDiasAlertaVencimiento] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [colorTema, setColorTema] = useState('#8B6914');
  const [colorSecundario, setColorSecundario] = useState('#C9A03D');
  const [presetVisual, setPresetVisual] = useState('bodega');
  const [radioBordes, setRadioBordes] = useState('md');
  const [radioBotones, setRadioBotones] = useState('md');
  const [densidadVisual, setDensidadVisual] = useState('comoda');
  const [modoVisual, setModoVisual] = useState('claro');
  const [animaciones, setAnimaciones] = useState('activas');
  const [estiloBotones, setEstiloBotones] = useState('solid');
  const [estiloSidebar, setEstiloSidebar] = useState('walnut');
  const [sombraUi, setSombraUi] = useState('suave');
  const [metodosPago, setMetodosPago] = useState(() => parsePaymentMethods());

  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [cargandoGuardado, setCargandoGuardado] = useState(false);

  const permisos = session?.user?.rol?.permisos || {};

  const visibleTabs = useMemo(
    () => ALL_TABS.filter((tab) => permisos[tab.permKey]),
    [permisos]
  );

  const tabParam = searchParams.get('tab');
  const activeTab = useMemo(() => {
    if (tabParam && visibleTabs.some((tab) => tab.id === tabParam)) return tabParam;
    return visibleTabs[0]?.id || 'negocio';
  }, [tabParam, visibleTabs]);

  const isSettingsTab = ['negocio', 'facturacion', 'inventario', 'apariencia', 'pagos'].includes(activeTab);

  const setActiveTab = (id) => {
    router.replace(`/dashboard/configuracion?tab=${id}`, { scroll: false });
  };

  useEffect(() => {
    if (!tabParam || !visibleTabs.some((tab) => tab.id === tabParam)) {
      if (visibleTabs[0]) {
        router.replace(`/dashboard/configuracion?tab=${visibleTabs[0].id}`, { scroll: false });
      }
    }
  }, [tabParam, visibleTabs, router]);

  useEffect(() => {
    if (loading) return;
    updateConfigState({
      nombre_negocio: nombreNegocio || 'Mi Licorería',
      logo_url: logoUrl,
      color_tema: colorTema,
      color_secundario: colorSecundario,
      preset_visual: presetVisual,
      moneda_simbolo: monedaSimbolo || '$',
      radio_bordes: radioBordes,
      radio_botones: radioBotones,
      densidad_visual: densidadVisual,
      modo_visual: modoVisual,
      animaciones,
      estilo_botones: estiloBotones,
      estilo_sidebar: estiloSidebar,
      sombra_ui: sombraUi,
    });
  }, [
    nombreNegocio, logoUrl, colorTema, colorSecundario, presetVisual, monedaSimbolo,
    radioBordes, radioBotones, densidadVisual, modoVisual, animaciones,
    estiloBotones, estiloSidebar, sombraUi, updateConfigState, loading,
  ]);

  async function loadConfig() {
    try {
      const res = await fetch('/api/configuracion');
      const json = await res.json();
      const map = json.configMap || {};
      setNombreNegocio(map.nombre_negocio || '');
      setDireccion(map.direccion || '');
      setTelefono(map.telefono || '');
      setRifNit(map.rif_nit || '');
      setMonedaSimbolo(map.moneda_simbolo || '');
      setImpuestoPorcentaje(map.impuesto_porcentaje || '0');
      setPrefijoFactura(map.prefijo_factura || 'FAC-');
      setSiguienteNumFactura(map.siguiente_num_factura || '1');
      setDiasAlertaVencimiento(map.dias_alerta_vencimiento || '15');
      setLogoUrl(map.logo_url || '');
      setColorTema(map.color_tema || '#8B6914');
      setColorSecundario(map.color_secundario || '#C9A03D');
      setPresetVisual(map.preset_visual || 'bodega');
      setRadioBordes(map.radio_bordes || 'md');
      setRadioBotones(map.radio_botones || 'md');
      setDensidadVisual(map.densidad_visual || 'comoda');
      setModoVisual(map.modo_visual || 'claro');
      setAnimaciones(map.animaciones || 'activas');
      setEstiloBotones(map.estilo_botones || 'solid');
      setEstiloSidebar(map.estilo_sidebar || 'walnut');
      setSombraUi(map.sombra_ui || 'suave');
      setMetodosPago(parsePaymentMethods(map.metodos_pago));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && permisos.configuracion) {
      loadConfig();
    } else if (status !== 'loading') {
      setLoading(false);
    }
  }, [status, session]);

  const handlePresetChange = (presetId) => {
    if (presetId === 'personalizado') {
      setPresetVisual('personalizado');
      return;
    }
    const values = applyPreset(presetId);
    if (!values) return;
    setPresetVisual(presetId);
    setColorTema(values.color_tema);
    setColorSecundario(values.color_secundario);
    setModoVisual(values.modo_visual);
    setEstiloSidebar(values.estilo_sidebar);
    setEstiloBotones(values.estilo_botones);
    setRadioBordes(values.radio_bordes);
    setRadioBotones(values.radio_botones);
    setDensidadVisual(values.densidad_visual);
    setAnimaciones(values.animaciones);
    setSombraUi(values.sombra_ui);
  };

  const handleManualAppearanceChange = () => {
    if (presetVisual !== 'personalizado') {
      setPresetVisual('personalizado');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargandoGuardado(true);
    setMensajeExito('');
    setMensajeError('');

    const payload = {
      nombre_negocio: nombreNegocio,
      direccion,
      telefono,
      rif_nit: rifNit,
      moneda_simbolo: monedaSimbolo,
      impuesto_porcentaje: impuestoPorcentaje,
      prefijo_factura: prefijoFactura,
      siguiente_num_factura: siguienteNumFactura,
      dias_alerta_vencimiento: diasAlertaVencimiento,
      logo_url: logoUrl,
      color_tema: colorTema,
      color_secundario: colorSecundario,
      preset_visual: presetVisual,
      radio_bordes: radioBordes,
      radio_botones: radioBotones,
      densidad_visual: densidadVisual,
      modo_visual: modoVisual,
      animaciones,
      estilo_botones: estiloBotones,
      estilo_sidebar: estiloSidebar,
      sombra_ui: sombraUi,
      metodos_pago: serializePaymentMethods(metodosPago),
    };

    try {
      const res = await fetch('/api/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.error) {
        setMensajeExito('Configuración guardada correctamente.');
        updateConfigState(payload);
        setTimeout(() => setMensajeExito(''), 4000);
      } else {
        setMensajeError(json.error || 'No se pudo guardar la configuración.');
      }
    } catch {
      setMensajeError('Error de red al guardar los ajustes.');
    } finally {
      setCargandoGuardado(false);
    }
  };

  if (status === 'loading') {
    return <LoadingState message="Cargando configuración..." />;
  }

  const canAccess = permisos.configuracion || permisos.usuarios || permisos.auditoria;

  if (!canAccess) {
    return (
      <DashboardModule title="Acceso denegado">
        <div className="glass-panel state-panel--denied">
          <AlertTriangle size={40} className="text-warning" />
          <h2>No tienes permiso para acceder a configuración</h2>
          <p>Contacta a un administrador si necesitas permisos para ajustar el sistema.</p>
        </div>
      </DashboardModule>
    );
  }

  if (loading && permisos.configuracion && isSettingsTab) {
    return <LoadingState message="Cargando configuración..." />;
  }

  const settingsTabs = visibleTabs.filter((tab) => tab.group === 'settings');
  const adminTabs = visibleTabs.filter((tab) => tab.group === 'admin');

  return (
    <DashboardModule title="Configuración" className="config-page page-enter">
      <div className="glass-panel config-shell config-shell--wide">
        <div className="config-shell__intro">
          <div>
            <h2 className="config-shell__title">Ajustes del establecimiento</h2>
            <p className="config-shell__desc">{TAB_INTRO[activeTab]}</p>
          </div>
          {mensajeExito && (
            <div className="toast-inline toast-inline--success">
              <CheckCircle size={16} />
              <span>{mensajeExito}</span>
            </div>
          )}
          {mensajeError && (
            <div className="toast-inline toast-inline--error">
              <AlertTriangle size={16} />
              <span>{mensajeError}</span>
            </div>
          )}
        </div>

        <nav className="settings-nav" aria-label="Secciones de configuración">
          {settingsTabs.length > 0 && (
            <div className="settings-nav__group">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={15} className="settings-tab__icon" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
          {adminTabs.length > 0 && (
            <div className="settings-nav__group settings-nav__group--admin">
              {adminTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={15} className="settings-tab__icon" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </nav>

        {activeTab === 'usuarios' && permisos.usuarios && (
          <div className="config-admin-panel">
            <UsuariosPanel />
          </div>
        )}

        {activeTab === 'auditoria' && permisos.auditoria && (
          <div className="config-admin-panel">
            <AuditoriaPanel />
          </div>
        )}

        {isSettingsTab && permisos.configuracion && (
          <form onSubmit={handleSubmit} className="config-form">
            {activeTab === 'negocio' && (
              <ConfigSectionLayout
                asideTitle="Vista en comprobante"
                aside={
                  <BusinessTicketPreview
                    nombreNegocio={nombreNegocio}
                    rifNit={rifNit}
                    telefono={telefono}
                    direccion={direccion}
                    monedaSimbolo={monedaSimbolo}
                  />
                }
              >
                <section className="config-block config-block--fill">
                  <div className="config-block__head">
                    <h3 className="config-block__title">Datos del establecimiento</h3>
                    <p className="config-block__desc">
                      Información legal y de contacto. Aparece en tickets, facturas PDF y reportes impresos.
                    </p>
                  </div>
                  <div className="form-grid form-grid--relaxed">
                    <div className="form-group span-2">
                      <label className="label-field">Nombre del establecimiento</label>
                      <input
                        type="text"
                        value={nombreNegocio}
                        onChange={(e) => setNombreNegocio(e.target.value)}
                        className="input-field"
                        placeholder="Ej. Licorería Evaluna"
                      />
                    </div>
                    <div className="form-group">
                      <label className="label-field">RIF / NIT</label>
                      <input
                        type="text"
                        value={rifNit}
                        onChange={(e) => setRifNit(e.target.value)}
                        className="input-field"
                        placeholder="Identificación fiscal"
                      />
                    </div>
                    <div className="form-group">
                      <label className="label-field">Teléfono</label>
                      <input
                        type="text"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        className="input-field"
                        placeholder="Contacto del local"
                      />
                    </div>
                    <div className="form-group span-2">
                      <label className="label-field">Dirección</label>
                      <input
                        type="text"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        className="input-field"
                        placeholder="Dirección completa del punto de venta"
                      />
                    </div>
                  </div>
                </section>
              </ConfigSectionLayout>
            )}

            {activeTab === 'facturacion' && (
              <ConfigSectionLayout
                asideTitle="Correlativo e impuesto"
                aside={
                  <InvoicePreview
                    prefijoFactura={prefijoFactura}
                    siguienteNumFactura={siguienteNumFactura}
                    monedaSimbolo={monedaSimbolo}
                    impuestoPorcentaje={impuestoPorcentaje}
                  />
                }
              >
                <section className="config-block config-block--fill">
                  <div className="config-block__head">
                    <h3 className="config-block__title">Facturación y moneda</h3>
                    <p className="config-block__desc">
                      Define cómo se numeran las ventas y qué impuesto se aplica en el POS.
                    </p>
                  </div>
                  <div className="form-grid form-grid--relaxed">
                    <div className="form-group">
                      <label className="label-field">Símbolo de moneda</label>
                      <input
                        type="text"
                        value={monedaSimbolo}
                        onChange={(e) => setMonedaSimbolo(e.target.value)}
                        className="input-field"
                        placeholder="$"
                      />
                      <p className="field-hint">Se muestra en tablas, POS y tickets.</p>
                    </div>
                    <div className="form-group">
                      <label className="label-field">Impuesto (%)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={impuestoPorcentaje}
                        onChange={(e) => setImpuestoPorcentaje(e.target.value)}
                        className="input-field"
                      />
                      <p className="field-hint">0 si no aplicas impuesto adicional.</p>
                    </div>
                    <div className="form-group">
                      <label className="label-field">Prefijo de factura</label>
                      <input
                        type="text"
                        value={prefijoFactura}
                        onChange={(e) => setPrefijoFactura(e.target.value)}
                        className="input-field"
                        placeholder="FAC-"
                      />
                    </div>
                    <div className="form-group">
                      <label className="label-field">Siguiente número</label>
                      <input
                        type="number"
                        min="1"
                        value={siguienteNumFactura}
                        onChange={(e) => setSiguienteNumFactura(e.target.value)}
                        className="input-field"
                      />
                      <p className="field-hint">No retrocede; solo avanza con ventas nuevas.</p>
                    </div>
                  </div>
                </section>
              </ConfigSectionLayout>
            )}

            {activeTab === 'inventario' && (
              <ConfigSectionLayout
                asideTitle="Alertas en el panel"
                aside={<InventoryAlertPreview diasAlertaVencimiento={diasAlertaVencimiento} />}
              >
                <section className="config-block config-block--fill">
                  <div className="config-block__head">
                    <h3 className="config-block__title">Alertas de inventario</h3>
                    <p className="config-block__desc">
                      Controla cuándo el sistema te avisa sobre productos por vencer o stock bajo.
                    </p>
                  </div>
                  <div className="form-grid form-grid--relaxed">
                    <div className="form-group">
                      <label className="label-field">Días de alerta por vencimiento</label>
                      <input
                        type="number"
                        min="1"
                        value={diasAlertaVencimiento}
                        onChange={(e) => setDiasAlertaVencimiento(e.target.value)}
                        className="input-field"
                      />
                      <p className="field-hint">
                        Productos y lotes que vencen dentro de este plazo aparecerán destacados en el inicio.
                      </p>
                    </div>
                    <div className="form-group span-2">
                      <div className="config-info-card">
                        <h4>Stock bajo mínimo</h4>
                        <p>
                          El umbral de cada producto se define en Inventario al crear o editar el ítem. El panel de
                          inicio muestra cuántos productos están bajo su mínimo configurado.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </ConfigSectionLayout>
            )}

            {activeTab === 'pagos' && (
              <ConfigSectionLayout
                asideTitle="Dónde se usan"
                aside={<PaymentMethodsPreview methods={metodosPago} />}
              >
                <PaymentMethodsPanel methods={metodosPago} onChange={setMetodosPago} />
              </ConfigSectionLayout>
            )}

            {activeTab === 'apariencia' && (
              <AppearanceSettings
                logoUrl={logoUrl}
                onLogoUrlChange={setLogoUrl}
                colorTema={colorTema}
                onColorTemaChange={setColorTema}
                colorSecundario={colorSecundario}
                onColorSecundarioChange={setColorSecundario}
                presetVisual={presetVisual}
                onPresetChange={handlePresetChange}
                onManualChange={handleManualAppearanceChange}
                radioBordes={radioBordes}
                onRadioBordesChange={setRadioBordes}
                radioBotones={radioBotones}
                onRadioBotonesChange={setRadioBotones}
                densidadVisual={densidadVisual}
                onDensidadChange={setDensidadVisual}
                modoVisual={modoVisual}
                onModoVisualChange={setModoVisual}
                animaciones={animaciones}
                onAnimacionesChange={setAnimaciones}
                estiloBotones={estiloBotones}
                onEstiloBotonesChange={setEstiloBotones}
                estiloSidebar={estiloSidebar}
                onEstiloSidebarChange={setEstiloSidebar}
                sombraUi={sombraUi}
                onSombraUiChange={setSombraUi}
                nombreNegocio={nombreNegocio}
                monedaSimbolo={monedaSimbolo}
              />
            )}

            <div className="form-footer-actions">
              <Button type="submit" variant="primary" disabled={cargandoGuardado}>
                <Save size={18} />
                <span>{cargandoGuardado ? 'Guardando...' : 'Guardar configuración'}</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </DashboardModule>
  );
}

export default function ConfiguracionPage() {
  return (
    <Suspense fallback={<LoadingState message="Cargando configuración..." />}>
      <ConfiguracionContent />
    </Suspense>
  );
}
