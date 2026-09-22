import { useEffect, useState } from 'react';
import { Calendar, TrendingUp, Package, CreditCard, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';

interface ReporteDia { total_ventas: number; total_ganancias: number; numero_ventas: number; }
interface ReporteMes { total_ventas: number; total_ganancias: number; numero_ventas: number; }
interface ProductoVendido { producto: string; cantidad: number; total: number; }
interface MetodoPago { metodo: string; total: number; }

export default function ReportesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reporteDia, setReporteDia] = useState<ReporteDia | null>(null);
  const [reporteMes, setReporteMes] = useState<ReporteMes | null>(null);
  const [gananciasDia, setGananciasDia] = useState<number | null>(null);
  const [topProductos, setTopProductos] = useState<ProductoVendido[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [periodo, setPeriodo] = useState({ fecha_inicio: '', fecha_fin: '' });
  const [reportePeriodo, setReportePeriodo] = useState<{ total_ventas: number; total_ganancias: number; numero_ventas: number } | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [dia, mes, ganDia, top, metodos] = await Promise.allSettled([
        api.get<ReporteDia>('/apiReportes/ventas/dia/'),
        api.get<ReporteMes>('/apiReportes/ventas/mes/'),
        api.get<{ total_ganancias: number }>('/apiReportes/ganancias/dia/'),
        api.get<ProductoVendido[]>('/apiReportes/ventas/productos-mas-vendidos/'),
        api.get<MetodoPago[]>('/apiReportes/ventas/metodo-pago/'),
      ]);
      if (dia.status === 'fulfilled') setReporteDia(dia.value);
      if (mes.status === 'fulfilled') setReporteMes(mes.value);
      if (ganDia.status === 'fulfilled') setGananciasDia(ganDia.value.total_ganancias);
      if (top.status === 'fulfilled') setTopProductos(Array.isArray(top.value) ? top.value : []);
      if (metodos.status === 'fulfilled') setMetodosPago(Array.isArray(metodos.value) ? metodos.value : []);
    } catch {
      setError('No se pudieron cargar los reportes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function buscarPeriodo() {
    if (!periodo.fecha_inicio || !periodo.fecha_fin) return;
    try {
      const data = await api.get<{ total_ventas: number; total_ganancias: number; numero_ventas: number }>(
        `/apiReportes/ventas/periodo/?fecha_inicio=${periodo.fecha_inicio}&fecha_fin=${periodo.fecha_fin}`
      );
      setReportePeriodo(data);
    } catch {
      alert('Error al consultar el período');
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const cards = [
    {
      label: 'Ventas del Día',
      value: `S/ ${Number(reporteDia?.total_ventas ?? 0).toFixed(2)}`,
      sub: `${Number(reporteDia?.numero_ventas ?? 0)} ventas`,
      icon: DollarSign,
      color: 'primary',
    },
    {
      label: 'Ganancias del Día',
      value: `S/ ${Number(gananciasDia ?? 0).toFixed(2)}`,
      sub: 'Utilidad neta',
      icon: TrendingUp,
      color: 'success',
    },
    {
      label: 'Ventas del Mes',
      value: `S/ ${Number(reporteMes?.total_ventas ?? 0).toFixed(2)}`,
      sub: `${Number(reporteMes?.numero_ventas ?? 0)} ventas`,
      icon: Calendar,
      color: 'accent',
    },
  ];


  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Reportes" subtitle="Análisis y estadísticas de ventas" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-neutral-500">{card.label}</p>
                <div className={`w-10 h-10 rounded-xl bg-${card.color}-50 flex items-center justify-center`}>
                  <Icon size={20} className={`text-${card.color}-600`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-neutral-800">{card.value}</p>
              <p className="text-xs text-neutral-400 mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Periodo filter */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-accent-600" />
          <h3 className="text-sm font-semibold text-neutral-700">Reporte por período</h3>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Fecha inicio</label>
            <input type="date" value={periodo.fecha_inicio} onChange={(e) => setPeriodo({ ...periodo, fecha_inicio: e.target.value })} className="input-base w-44" />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Fecha fin</label>
            <input type="date" value={periodo.fecha_fin} onChange={(e) => setPeriodo({ ...periodo, fecha_fin: e.target.value })} className="input-base w-44" />
          </div>
          <button onClick={buscarPeriodo} className="btn-primary">Consultar</button>
        </div>
        {reportePeriodo && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="rounded-xl bg-neutral-50 p-3">
              <p className="text-xs text-neutral-400">Total ventas</p>
              <p className="text-lg font-bold text-neutral-700">
                S/ {Number(reportePeriodo?.total_ventas ?? 0).toFixed(2)}
              </p>

            </div>
            <div className="rounded-xl bg-neutral-50 p-3">
              <p className="text-xs text-neutral-400">Ganancias</p>
              <p className="text-lg font-bold text-success-600">S/ {Number(reportePeriodo?.total_ganancias ?? 0).toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-3">
              <p className="text-xs text-neutral-400">N° ventas</p>
              <p className="text-lg font-bold text-neutral-700">{Number(reportePeriodo?.numero_ventas ?? 0).toFixed(0)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package size={18} className="text-primary-600" />
            <h3 className="text-sm font-semibold text-neutral-700">Productos más vendidos</h3>
          </div>
          {topProductos.length === 0 ? (
            <EmptyState message="Sin datos disponibles" />
          ) : (
            <div className="space-y-3">
              {topProductos.slice(0, 8).map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary-50 text-primary-600 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="text-sm text-neutral-600">{p.producto}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400">{p.cantidad} und.</span>
                    {p.total && <span className="badge bg-primary-50 text-primary-700">S/ {p.total.toFixed(2)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-accent-600" />
            <h3 className="text-sm font-semibold text-neutral-700">Métodos de pago</h3>
          </div>
          {metodosPago.length === 0 ? (
            <EmptyState message="Sin datos disponibles" />
          ) : (
            <div className="space-y-3">
              {metodosPago.map((m, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">{m.metodo}</span>
                  <div className="flex items-center gap-2">
                    <span className="badge bg-accent-50 text-accent-700">
                      S/ {Number(m.total ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
