import { useEffect, useState } from 'react';
import { Eye, Receipt, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';
import type { Venta, Producto, DetalleVenta, PagoVenta } from '@/types';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/ui/Modal';
import SearchInput from '@/components/ui/SearchInput';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';

export default function HistorialVentasPage() {
  const [items, setItems] = useState<Venta[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [detailOpen, setDetailOpen] = useState<Venta | null>(null);
  const [pagoModal, setPagoModal] = useState<Venta | null>(null);
  const [pagoForm, setPagoForm] = useState({ monto: '', metodo: 'EFECTIVO' as 'EFECTIVO' | 'YAPE' | 'PLIN', monto_recibido: '' });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [ventasData, prodData] = await Promise.all([
        api.get<Venta[]>('/apiVentas/ventas/'),
        api.get<Producto[]>('/apiProductos/productos/'),
      ]);
      setItems(Array.isArray(ventasData) ? ventasData : []);
      setProductos(Array.isArray(prodData) ? prodData : []);
    } catch {
      setError('No se pudieron cargar las ventas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filteredVentas = items.filter((v) =>
    (v.cliente_nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    String(v.id || '').includes(search)
  );

  async function handlePago() {
    if (!pagoModal?.id) return;
    try {
      await api.post(`/apiVentas/ventas/${pagoModal.id}/pagos/`, {
        monto: pagoForm.monto,
        metodo: pagoForm.metodo,
        monto_recibido: pagoForm.monto_recibido || pagoForm.monto,
      });
      setPagoModal(null);
      setPagoForm({ monto: '', metodo: 'EFECTIVO', monto_recibido: '' });
      await load();
    } catch {
      alert('Error al registrar el pago');
    }
  }

  const estadoBadge = (estado?: string) => {
    const styles: Record<string, string> = {
      PENDIENTE: 'bg-warning-50 text-warning-700',
      PARCIALMENTE_PAGADA: 'bg-secondary-50 text-secondary-700',
      PAGADA: 'bg-success-50 text-success-700',
    };
    return styles[estado || ''] || 'bg-neutral-100 text-neutral-500';
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Historial de Ventas" subtitle="Todas las ventas registradas" />

      <div className="card">
        <div className="p-4 border-b border-neutral-100">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar venta..." />
        </div>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : filteredVentas.length === 0 ? (
          <EmptyState message="No hay ventas registradas" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">N°</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Total</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Pagado</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Saldo</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Estado</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredVentas.map((v) => (
                  <tr key={v.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-neutral-700">#{v.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                          <Receipt size={16} className="text-primary-600" />
                        </div>
                        <span className="text-sm text-neutral-700">{v.cliente_nombre || 'Cliente general'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">{v.fecha ? new Date(v.fecha).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-neutral-700">S/ {Number(v.total || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-neutral-500">S/ {Number(v.total_pagado || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-neutral-500">S/ {Number(v.saldo_pendiente || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${estadoBadge(v.estado_pago)}`}>{v.estado_pago}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setDetailOpen(v)} className="p-2 rounded-lg text-neutral-400 hover:bg-primary-50 hover:text-primary-600 transition-colors" title="Ver detalles">
                          <Eye size={16} />
                        </button>
                        {v.estado_pago !== 'PAGADA' && (
                          <button onClick={() => { setPagoModal(v); setPagoForm({ monto: v.saldo_pendiente || '', metodo: 'EFECTIVO', monto_recibido: '' }); }} className="p-2 rounded-lg text-neutral-400 hover:bg-success-50 hover:text-success-600 transition-colors" title="Registrar pago">
                            <DollarSign size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal open={detailOpen !== null} onClose={() => setDetailOpen(null)} title="Detalle de Venta" size="lg">
        {detailOpen && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-400">Cliente</p>
                <p className="text-sm font-medium text-neutral-700">{detailOpen.cliente_nombre || 'Cliente general'}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400">Fecha</p>
                <p className="text-sm font-medium text-neutral-700">{detailOpen.fecha ? new Date(detailOpen.fecha).toLocaleString() : '-'}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400">Total</p>
                <p className="text-sm font-medium text-neutral-700">S/ {Number(detailOpen.total || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400">Estado</p>
                <span className={`badge ${estadoBadge(detailOpen.estado_pago)}`}>{detailOpen.estado_pago}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600 mb-2">Productos</p>
              <div className="rounded-xl border border-neutral-100 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-neutral-50 text-left">
                      <th className="px-4 py-2 text-xs font-semibold text-neutral-400">Producto</th>
                      <th className="px-4 py-2 text-xs font-semibold text-neutral-400 text-right">Cant.</th>
                      <th className="px-4 py-2 text-xs font-semibold text-neutral-400 text-right">P. Unit.</th>
                      <th className="px-4 py-2 text-xs font-semibold text-neutral-400 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailOpen.detalles?.map((d: DetalleVenta, i: number) => (
                      <tr key={i} className="border-t border-neutral-50">
                        <td className="px-4 py-2 text-sm text-neutral-600">{d.nombre_producto || productos.find(p => p.id === d.producto)?.nombre || `Producto #${d.producto}`}</td>
                        <td className="px-4 py-2 text-sm text-neutral-600 text-right">{d.cantidad}</td>
                        <td className="px-4 py-2 text-sm text-neutral-600 text-right">S/ {Number(d.precio_unitario || 0).toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm font-medium text-neutral-700 text-right">S/ {Number(d.subtotal || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {detailOpen.pagos && detailOpen.pagos.length > 0 && (
              <div>
                <p className="text-sm font-medium text-neutral-600 mb-2">Pagos registrados</p>
                <div className="space-y-2">
                  {detailOpen.pagos.map((p: PagoVenta, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-2">
                      <span className="text-sm text-neutral-600">{p.metodo}</span>
                      <span className="text-sm font-medium text-neutral-700">S/ {Number(p.monto).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal open={pagoModal !== null} onClose={() => setPagoModal(null)} title="Registrar Pago" size="sm">
        {pagoModal && (
          <div className="space-y-4">
            <div className="rounded-xl bg-neutral-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Total:</span>
                <span className="font-medium text-neutral-700">S/ {Number(pagoModal.total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-neutral-500">Pagado:</span>
                <span className="font-medium text-neutral-700">S/ {Number(pagoModal.total_pagado || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-neutral-500">Saldo:</span>
                <span className="font-medium text-error-600">S/ {Number(pagoModal.saldo_pendiente || 0).toFixed(2)}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1.5">Monto a pagar</label>
              <input type="number" step="0.01" value={pagoForm.monto} onChange={(e) => setPagoForm({ ...pagoForm, monto: e.target.value })} className="input-base" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1.5">Monto recibido</label>
              <input type="number" step="0.01" value={pagoForm.monto_recibido} onChange={(e) => setPagoForm({ ...pagoForm, monto_recibido: e.target.value })} className="input-base" placeholder="0.00" />
            </div>
            {pagoForm.metodo === 'EFECTIVO' && pagoForm.monto_recibido && pagoForm.monto && (
              <div className="rounded-lg bg-success-50 px-4 py-2 text-sm text-success-700">
                Vuelto: S/ {(Number(pagoForm.monto_recibido) - Number(pagoForm.monto)).toFixed(2)}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1.5">Metodo de pago</label>
              <select value={pagoForm.metodo} onChange={(e) => setPagoForm({ ...pagoForm, metodo: e.target.value as 'EFECTIVO' | 'YAPE' | 'PLIN' })} className="input-base">
                <option value="EFECTIVO">Efectivo</option>
                <option value="YAPE">Yape</option>
                <option value="PLIN">Plin</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setPagoModal(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handlePago} className="btn-primary flex-1">Registrar Pago</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
