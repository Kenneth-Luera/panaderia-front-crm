import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Truck } from 'lucide-react';
import { api } from '@/lib/api';
import type { Proveedor } from '@/types';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import SearchInput from '@/components/ui/SearchInput';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';

export default function ProveedoresPage() {
  const [items, setItems] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nombre: '', ruc: '', telefono: '', email: '', direccion: '', activo: true });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Proveedor[]>('/apiProveedores/proveedores/');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError('No se pudieron cargar los proveedores');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = items.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) || p.ruc.includes(search)
  );

  function openCreate() {
    setEditing(null);
    setForm({ nombre: '', ruc: '', telefono: '', email: '', direccion: '', activo: true });
    setModalOpen(true);
  }

  function openEdit(p: Proveedor) {
    setEditing(p);
    setForm({ nombre: p.nombre, ruc: p.ruc, telefono: p.telefono || '', email: p.email || '', direccion: p.direccion || '', activo: p.activo ?? true });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form };
      if (editing?.id) {
        await api.put(`/apiProveedores/proveedores/${editing.id}/`, body);
      } else {
        await api.post('/apiProveedores/proveedores/', body);
      }
      setModalOpen(false);
      await load();
    } catch {
      alert('Error al guardar el proveedor');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleteId === null) return;
    try {
      await api.delete(`/apiProveedores/proveedores/${deleteId}/`);
      await load();
    } catch {
      alert('Error al eliminar el proveedor');
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Proveedores"
        subtitle="Gestiona tus proveedores"
        action={<button onClick={openCreate} className="btn-primary"><Plus size={18} /> Nuevo Proveedor</button>}
      />

      <div className="card">
        <div className="p-4 border-b border-neutral-100">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar proveedor..." />
        </div>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState message="No hay proveedores registrados" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Proveedor</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">RUC</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Teléfono</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Email</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Estado</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
                          <Truck size={16} className="text-accent-600" />
                        </div>
                        <span className="text-sm font-medium text-neutral-700">{p.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">{p.ruc}</td>
                    <td className="px-6 py-4 text-sm text-neutral-500">{p.telefono || '-'}</td>
                    <td className="px-6 py-4 text-sm text-neutral-500">{p.email || '-'}</td>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Proveedor' : 'Nuevo Proveedor'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1.5">Nombre</label>
              <input type="text" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="input-base" placeholder="Nombre del proveedor" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1.5">RUC</label>
              <input type="text" required value={form.ruc} onChange={(e) => setForm({ ...form, ruc: e.target.value })} className="input-base" placeholder="RUC" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1.5">Teléfono</label>
              <input type="text" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="input-base" placeholder="Teléfono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-base" placeholder="email@ejemplo.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1.5">Dirección</label>
            <input type="text" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} className="input-base" placeholder="Dirección" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} className="w-4 h-4 rounded accent-primary-600" />
            <span className="text-sm text-neutral-600">Proveedor activo</span>
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
        title="Eliminar Proveedor"
        message="¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer."
      />
    </div>
  );
}
