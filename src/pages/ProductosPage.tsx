import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Package, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import type { Producto, Categoria } from '@/types';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import SearchInput from '@/components/ui/SearchInput';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';

export default function ProductosPage() {
  const [items, setItems] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    precio_compra: '',
    precio_venta: '',
    stock: '',
    stock_minimo: '',
    activo: true,
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [prodData, catData] = await Promise.all([
        api.get<Producto[]>('/apiProductos/productos/'),
        api.get<Categoria[]>('/apiCategorias/categorias/'),
      ]);
      setItems(Array.isArray(prodData) ? prodData : []);
      setCategorias(Array.isArray(catData) ? catData : []);
    } catch {
      setError('No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = items.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditing(null);
    setForm({ nombre: '', descripcion: '', categoria: '', precio_compra: '', precio_venta: '', stock: '', stock_minimo: '', activo: true });
    setModalOpen(true);
  }

  function openEdit(p: Producto) {
    setEditing(p);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      categoria: String(p.categoria),
      precio_compra: p.precio_compra,
      precio_venta: p.precio_venta,
      stock: p.stock,
      stock_minimo: p.stock_minimo,
      activo: p.activo ?? true,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        categoria: Number(form.categoria),
        precio_compra: form.precio_compra,
        precio_venta: form.precio_venta,
        stock: form.stock,
        stock_minimo: form.stock_minimo,
        activo: form.activo,
      };
      if (editing?.id) {
        await api.put(`/apiProductos/productos/${editing.id}/`, body);
      } else {
        await api.post('/apiProductos/productos/', body);
      }
      setModalOpen(false);
      await load();
    } catch {
      alert('Error al guardar el producto');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleteId === null) return;
    try {
      await api.delete(`/apiProductos/productos/${deleteId}/`);
      await load();
    } catch {
      alert('Error al eliminar el producto');
    }
  }

  function catName(id: number) {
    return categorias.find((c) => c.id === id)?.nombre || '-';
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Productos"
        subtitle="Gestiona el catálogo de productos"
        action={
          <button onClick={openCreate} className="btn-primary">
            <Plus size={18} /> Nuevo Producto
          </button>
        }
      />

      <div className="card">
        <div className="p-4 border-b border-neutral-100">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar producto..." />
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState message="No hay productos registrados" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Producto</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Categoría</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">P. Venta</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Stock</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Estado</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-secondary-50 flex items-center justify-center">
                          <Package size={16} className="text-secondary-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-neutral-700">{p.nombre}</span>
                          {p.descripcion && <p className="text-xs text-neutral-400">{p.descripcion}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">{catName(p.categoria)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-neutral-700">S/ {Number(p.precio_venta).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${p.stock_bajo ? 'bg-warning-50 text-warning-700' : 'bg-neutral-100 text-neutral-600'}`}>
                        {p.stock} und.
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${p.activo ? 'bg-success-50 text-success-700' : 'bg-neutral-100 text-neutral-500'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-neutral-400 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => setDeleteId(p.id!)} className="p-2 rounded-lg text-neutral-400 hover:bg-error-50 hover:text-error-600 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Producto' : 'Nuevo Producto'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1.5">Nombre</label>
            <input type="text" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="input-base" placeholder="Nombre del producto" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1.5">Descripción</label>
            <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="input-base resize-none" rows={2} placeholder="Descripción opcional" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1.5">Categoría</label>
              <select required value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="input-base">
                <option value="">Seleccionar...</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1.5">Precio de venta (S/)</label>
              <input type="number" step="0.01" required value={form.precio_venta} onChange={(e) => setForm({ ...form, precio_venta: e.target.value })} className="input-base" placeholder="0.00" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1.5">P. Compra (S/)</label>
              <input type="number" step="0.01" value={form.precio_compra} onChange={(e) => setForm({ ...form, precio_compra: e.target.value })} className="input-base" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1.5">Stock</label>
              <input type="number" step="0.01" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input-base" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1.5">Stock mín.</label>
              <input type="number" step="0.01" value={form.stock_minimo} onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })} className="input-base" placeholder="0" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} className="w-4 h-4 rounded accent-primary-600" />
            <span className="text-sm text-neutral-600">Producto activo</span>
          </label>
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
        title="Eliminar Producto"
        message="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
      />
    </div>
  );
}
