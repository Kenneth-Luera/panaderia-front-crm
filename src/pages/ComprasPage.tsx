import { useEffect, useState } from 'react';
import { Plus, Trash2, Eye, ShoppingCart, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';
import type { Compra, Proveedor, Producto, DetalleCompra } from '@/types';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/ui/Modal';
import SearchInput from '@/components/ui/SearchInput';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';

export default function ComprasPage() {
  const [items, setItems] = useState<Compra[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState<Compra | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    proveedor: '',
    observaciones: '',
  });
  const [detalles, setDetalles] = useState<DetalleCompra[]>([]);
  const [pagoModal, setPagoModal] = useState<Compra | null>(null);
  const [pagoForm, setPagoForm] = useState<{ monto: string; metodo: 'EFECTIVO' | 'YAPE' | 'PLIN' }>({ monto: '', metodo: 'EFECTIVO' });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [comprasData, provData, prodData] = await Promise.all([
        api.get<Compra[]>('/apiCompras/compras/'),
        api.get<Proveedor[]>('/apiProveedores/proveedores/'),
        api.get<Producto[]>('/apiProductos/productos/'),
      ]);
      setItems(Array.isArray(comprasData) ? comprasData : []);
      setProveedores(Array.isArray(provData) ? provData : []);
      setProductos(Array.isArray(prodData) ? prodData : []);
    } catch {
      setError('No se pudieron cargar las compras');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = items.filter((c) => {
    const prov = proveedores.find((p) => p.id === c.proveedor);
    return prov?.nombre.toLowerCase().includes(search.toLowerCase()) || false;
  });

  function openCreate() {
    setForm({ proveedor: '', observaciones: '' });
    setDetalles([]);
    setModalOpen(true);
  }

  function addDetalle() {
    setDetalles([...detalles, { producto: null, cantidad: '', precio_unitario: '' }]);
  }

  function updateDetalle(index: number, field: keyof DetalleCompra, value: string | number | null) {
    const updated = [...detalles];
    updated[index] = { ...updated[index], [field]: value };
    setDetalles(updated);
  }

  function removeDetalle(index: number) {
    setDetalles(detalles.filter((_, i) => i !== index));
  }

  function calcTotal() {
    return detalles.reduce((sum, d) => sum + (Number(d.cantidad) * Number(d.precio_unitario) || 0), 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        proveedor: Number(form.proveedor),
        observaciones: form.observaciones,
        detalles: detalles.map((d) => ({
          producto: d.producto ? Number(d.producto) : null,
          producto_nuevo: d.producto_nuevo,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
        })),
      };
      await api.post('/apiCompras/compras/', body);
      setModalOpen(false);
      await load();
    } catch {
      alert('Error al crear la compra');
    } finally {
      setSaving(false);
    }
  }

  async function handlePago() {
    if (!pagoModal?.id) return;
    try {
      await api.post(`/apiCompras/compras/${pagoModal.id}/pagos/`, {
        monto: pagoForm.monto,
        metodo: pagoForm.metodo,
      });
      setPagoModal(null);
      setPagoForm({ monto: '', metodo: 'EFECTIVO' });
      await load();
    } catch {
      alert('Error al registrar el pago');
    }
  }

  function provName(id: number) {
    return proveedores.find((p) => p.id === id)?.nombre || '-';
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
      <PageHeader
        title="Compras"
        subtitle="Registro de compras a proveedores"
        action={<button onClick={openCreate} className="btn-primary"><Plus size={18} /> Nueva Compra</button>}
      />

      <div className="card">
        <div className="p-4 border-b border-neutral-100">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar compra..." />
        </div>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState message="No hay compras registradas" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Proveedor</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Total</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Pagado</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Saldo</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Estado</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
                          <ShoppingCart size={16} className="text-accent-600" />
                        </div>
                        <span className="text-sm font-medium text-neutral-700">{provName(c.proveedor)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">{c.fecha ? new Date(c.fecha).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-neutral-700">S/ {Number(c.total || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-neutral-500">S/ {Number(c.total_pagado || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-neutral-500">S/ {Number(c.saldo_pendiente || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${estadoBadge(c.estado_pago)}`}>{c.estado_pago || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setDetailOpen(c)} className="p-2 rounded-lg text-neutral-400 hover:bg-primary-50 hover:text-primary-600 transition-colors" title="Ver detalles">
                          <Eye size={16} />
                        </button>
                        {c.estado_pago !== 'PAGADA' && (
                          <button onClick={() => { setPagoModal(c); setPagoForm({ monto: c.saldo_pendiente || '', metodo: 'EFECTIVO' }); }} className="p-2 rounded-lg text-neutral-400 hover:bg-success-50 hover:text-success-600 transition-colors" title="Registrar pago">
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

      {/* Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Compra" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1.5">Proveedor</label>
              <select required value={form.proveedor} onChange={(e) => setForm({ ...form, proveedor: e.target.value })} className="input-base">
                <option value="">Seleccionar...</option>
                {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1.5">Observaciones</label>
              <input type="text" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} className="input-base" placeholder="Opcional" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-neutral-600">Detalle de productos</label>
              <button type="button" onClick={addDetalle} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                <Plus size={16} /> Agregar
              </button>
            </div>
            <div className="space-y-2">
              {detalles.map((d, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <select
                      value={d.producto || ''}
                      onChange={(e) => updateDetalle(i, 'producto', e.target.value ? Number(e.target.value) : null)}
                      className="input-base text-sm"
                    >
                      <option value="">Producto existente...</option>
                      {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input type="number" step="0.01" placeholder="Cant." value={d.cantidad} onChange={(e) => updateDetalle(i, 'cantidad', e.target.value)} className="input-base text-sm" required />
                  </div>
                  <div className="col-span-3">
                    <input type="number" step="0.01" placeholder="P. Unit." value={d.precio_unitario} onChange={(e) => updateDetalle(i, 'precio_unitario', e.target.value)} className="input-base text-sm" required />
                  </div>
                  <button type="button" onClick={() => removeDetalle(i)} className="col-span-1 p-2 rounded-lg text-neutral-400 hover:bg-error-50 hover:text-error-600 transition-colors flex items-center justify-center">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {detalles.length === 0 && <p className="text-sm text-neutral-400 text-center py-4">Agrega productos a la compra</p>}
            </div>
            {detalles.length > 0 && (
              <div className="flex justify-end mt-3">
                <span className="text-sm font-semibold text-neutral-700">Total: S/ {calcTotal().toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving || detalles.length === 0} className="btn-primary flex-1">{saving ? 'Guardando...' : 'Crear Compra'}</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal open={detailOpen !== null} onClose={() => setDetailOpen(null)} title="Detalle de Compra" size="lg">
        {detailOpen && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-400">Proveedor</p>
                <p className="text-sm font-medium text-neutral-700">{provName(detailOpen.proveedor)}</p>
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
            {detailOpen.observaciones && (
              <div>
                <p className="text-xs text-neutral-400">Observaciones</p>
                <p className="text-sm text-neutral-600">{detailOpen.observaciones}</p>
              </div>
            )}
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
                    {detailOpen.detalles?.map((d, i) => (
                      <tr key={i} className="border-t border-neutral-50">
                        <td className="px-4 py-2 text-sm text-neutral-600">{d.nombre_producto || productos.find(p => p.id === d.producto)?.nombre || `Producto #${d.producto}`}</td>
                        <td className="px-4 py-2 text-sm text-neutral-600 text-right">{d.cantidad}</td>
                        <td className="px-4 py-2 text-sm text-neutral-600 text-right">S/ {Number(d.precio_unitario).toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm font-medium text-neutral-700 text-right">S/ {Number(d.subtotal || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
              <label className="block text-sm font-medium text-neutral-600 mb-1.5">Método de pago</label>
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
