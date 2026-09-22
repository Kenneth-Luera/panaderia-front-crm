import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Warehouse, ArrowUpCircle, ArrowDownCircle, type LucideIcon } from 'lucide-react';
import { api } from '@/lib/api';
import type { MovimientoInventario, Producto } from '@/types';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import SearchInput from '@/components/ui/SearchInput';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';

export default function InventarioPage() {
  const [items, setItems] = useState<MovimientoInventario[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MovimientoInventario | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    producto: '',
    tipo: 'ENTRADA' as 'ENTRADA' | 'SALIDA' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO',
    cantidad: '',
    motivo: '',
    referencia: '',
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [movData, prodData] = await Promise.all([
        api.get<MovimientoInventario[]>('/apiInventario/movimientos/'),
        api.get<Producto[]>('/apiProductos/productos/'),
      ]);
      setItems(Array.isArray(movData) ? movData : []);
      setProductos(Array.isArray(prodData) ? prodData : []);
    } catch {
      setError('No se pudieron cargar los movimientos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = items.filter((m) => {
    const prod = productos.find((p) => p.id === m.producto);
    return (m.nombre_producto || prod?.nombre || '').toLowerCase().includes(search.toLowerCase());
  });

  function openCreate() {
    setEditing(null);
    setForm({ producto: '', tipo: 'ENTRADA', cantidad: '', motivo: '', referencia: '' });
    setModalOpen(true);
  }

  function openEdit(m: MovimientoInventario) {
    setEditing(m);
    setForm({ producto: String(m.producto), tipo: m.tipo, cantidad: m.cantidad, motivo: m.motivo || '', referencia: m.referencia || '' });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        producto: Number(form.producto),
        tipo: form.tipo,
        cantidad: form.cantidad,
        motivo: form.motivo,
        referencia: form.referencia,
      };
      if (editing?.id) {
        await api.put(`/apiInventario/movimientos/${editing.id}/`, body);
      } else {
        await api.post('/apiInventario/movimientos/', body);
      }
      setModalOpen(false);
      await load();
    } catch {
      alert('Error al guardar el movimiento');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleteId === null) return;
    try {
      await api.delete(`/apiInventario/movimientos/${deleteId}/`);
      await load();
    } catch {
      alert('Error al eliminar el movimiento');
    }
  }

  function prodName(id: number) {
    return productos.find((p) => p.id === id)?.nombre || `Producto #${id}`;
  }

  const tipoConfig: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
    ENTRADA: { icon: ArrowDownCircle, color: 'text-success-600', bg: 'bg-success-50' },
    SALIDA: { icon: ArrowUpCircle, color: 'text-error-600', bg: 'bg-error-50' },
    AJUSTE_POSITIVO: { icon: ArrowDownCircle, color: 'text-primary-600', bg: 'bg-primary-50' },
    AJUSTE_NEGATIVO: { icon: ArrowUpCircle, color: 'text-warning-600', bg: 'bg-warning-50' },
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Inventario"
        subtitle="Movimientos de inventario"
        action={<button onClick={openCreate} className="btn-primary"><Plus size={18} /> Nuevo Movimiento</button>}
      />

      <div className="card">
        <div className="p-4 border-b border-neutral-100">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar movimiento..." />
        </div>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState message="No hay movimientos registrados" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Producto</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Motivo</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const cfg = tipoConfig[m.tipo] || tipoConfig.ENTRADA;
                  const Icon = cfg.icon;
                  return (
                    <tr key={m.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                            <Icon size={16} className={cfg.color} />
                          </div>
                          <span className="text-sm text-neutral-600">{m.tipo.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-neutral-700">{m.nombre_producto || prodName(m.producto)}</td>
                      <td className="px-6 py-4 text-sm text-neutral-600">{m.cantidad}</td>
                      <td className="px-6 py-4 text-sm text-neutral-500">{m.motivo || '-'}</td>
                      <td className="px-6 py-4 text-sm text-neutral-500">{m.fecha ? new Date(m.fecha).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(m)} className="p-2 rounded-lg text-neutral-400 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => setDeleteId(m.id!)} className="p-2 rounded-lg text-neutral-400 hover:bg-error-50 hover:text-error-600 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Movimiento' : 'Nuevo Movimiento'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1.5">Producto</label>
            <select required value={form.producto} onChange={(e) => setForm({ ...form, producto: e.target.value })} className="input-base">
              <option value="">Seleccionar...</option>
              {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1.5">Tipo de movimiento</label>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as typeof form.tipo })} className="input-base">
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
              <option value="AJUSTE_POSITIVO">Ajuste positivo</option>
              <option value="AJUSTE_NEGATIVO">Ajuste negativo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1.5">Cantidad</label>
            <input type="number" step="0.01" required value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} className="input-base" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1.5">Motivo</label>
            <input type="text" value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} className="input-base" placeholder="Motivo del movimiento" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1.5">Referencia</label>
            <input type="text" value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} className="input-base" placeholder="Referencia (opcional)" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Movimiento"
        message="¿Estás seguro de que deseas eliminar este movimiento de inventario?"
      />
    </div>
  );
}
