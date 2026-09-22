import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Package, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { LoadingState, ErrorState } from '@/components/ui/States';

interface DashboardStats {
  ventas_dia: number;
  ganancias_dia: number;
  ventas_mes: number;
  productos_stock_bajo: number;
}

interface ProductoVendido {
  producto: string;
  cantidad: number;
}

interface MetodoPagoStat {
  metodo: string;
  total: number;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ventasDia, setVentasDia] = useState<number | null>(null);
  const [gananciasDia, setGananciasDia] = useState<number | null>(null);
  const [ventasMes, setVentasMes] = useState<number | null>(null);
  const [productosVendidos, setProductosVendidos] = useState<ProductoVendido[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPagoStat[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [dia, mes, topProd, metodos] = await Promise.allSettled([
          api.get<{ total_ventas?: number; total_ganancias?: number }>('/apiReportes/ventas/dia/'),
          api.get<{ total_ventas?: number }>('/apiReportes/ventas/mes/'),
          api.get<ProductoVendido[]>('/apiReportes/ventas/productos-mas-vendidos/'),
          api.get<MetodoPagoStat[]>('/apiReportes/ventas/metodo-pago/'),
        ]);

        if (dia.status === 'fulfilled') {
          setVentasDia(dia.value.total_ventas ?? 0);
          setGananciasDia(dia.value.total_ganancias ?? 0);
        }
        if (mes.status === 'fulfilled') setVentasMes(mes.value.total_ventas ?? 0);
        if (topProd.status === 'fulfilled') setProductosVendidos(topProd.value);
        if (metodos.status === 'fulfilled') setMetodosPago(metodos.value);
      } catch {
        setError('No se pudieron cargar los datos del panel');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const cards = [
    {
      label: 'Ventas del Día',
      value: `S/ ${Number(ventasDia ?? 0).toFixed(2)}`,
      icon: ShoppingBag,
      color: 'primary',
    },
    {
      label: 'Ganancias del Día',
      value: `S/ ${Number(gananciasDia ?? 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'success',
    },
    {
      label: 'Ventas del Mes',
      value: `S/ ${Number(ventasMes ?? 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'accent',
    },
  ];
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Panel Principal</h1>
        <p className="text-sm text-neutral-500 mt-1">Resumen general del negocio</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">{card.label}</p>
                  <p className="text-2xl font-bold text-neutral-800 mt-1">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-${card.color}-50 flex items-center justify-center`}>
                  <Icon size={24} className={`text-${card.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package size={18} className="text-primary-600" />
            <h3 className="text-sm font-semibold text-neutral-700">Productos más vendidos</h3>
          </div>
          {productosVendidos.length === 0 ? (
            <p className="text-sm text-neutral-400 py-4 text-center">Sin datos disponibles</p>
          ) : (
            <div className="space-y-3">
              {productosVendidos.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">{p.producto}</span>
                  <span className="badge bg-primary-50 text-primary-700">{p.cantidad} und.</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={18} className="text-accent-600" />
            <h3 className="text-sm font-semibold text-neutral-700">Métodos de pago</h3>
          </div>
          {metodosPago.length === 0 ? (
            <p className="text-sm text-neutral-400 py-4 text-center">Sin datos disponibles</p>
          ) : (
            <div className="space-y-3">
              {metodosPago.map((m, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">{m.metodo}</span>
                  <div className="flex items-center gap-2">
                    <span className="badge bg-accent-50 text-accent-700"> S/ {Number(m.total ?? 0).toFixed(2)} </span>
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
