import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Tags } from 'lucide-react';
import { api } from '@/lib/api';
import type { Categoria } from '@/types';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import SearchInput from '@/components/ui/SearchInput';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';

export default function CategoriasPage() {
  const [items, setItems] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', activa: true });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Categoria[]>('/apiCategorias/categorias/');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError('No se pudieron cargar las categorías');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = items.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditing(null);
    setForm({ nombre: '', descripcion: '', activa: true });
    setModalOpen(true);
  }

  function openEdit(cat: Categoria) {
    setEditing(cat);
    setForm({ nombre: cat.nombre, descripcion: cat.descripcion || '', activa: cat.activa ?? true });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { nombre: form.nombre, descripcion: form.descripcion, activa: form.activa };
      if (editing?.id) {
        await api.put(`/apiCategorias/categorias/${editing.id}/`, body);
      } else {
        await api.post('/apiCategorias/categorias/', body);
      }
      setModalOpen(false);
      await load();
    } catch {
      alert('Error al guardar la categoría');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleteId === null) return;
    try {
      await api.delete(`/apiCategorias/categorias/${deleteId}/`);
      await load();
    } catch {
      alert('Error al eliminar la categoría');
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Categorías"
        subtitle="Gestiona las categorías de productos"
        action={
          <button onClick={openCreate} className="btn-primary">
            <Plus size={18} /> Nueva Categoría
          </button>
        }
      />

      <div className="card">
        <div className="p-4 border-b border-neutral-100">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar categoría..." />
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState message="No hay categorías registradas" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Descripción</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase">Estado</th>
                  <th className="px-6 py-3 text-xs font-semibold text-neutral-400 uppercase text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cat) => (
                  <tr key={cat.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                          <Tags size={16} className="text-primary-600" />
                        </div>
                        <span className="text-sm font-medium text-neutral-700">{cat.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">{cat.descripcion || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${cat.activa ? 'bg-success-50 text-success-700' : 'bg-neutral-100 text-neutral-500'}`}>
                        {cat.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(cat)} className="p-2 rounded-lg text-neutral-400 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => setDeleteId(cat.id!)} className="p-2 rounded-lg text-neutral-400 hover:bg-error-50 hover:text-error-600 transition-colors">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Categoría' : 'Nueva Categoría'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1.5">Nombre</label>
            <input
              type="text"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="input-base"
              placeholder="Nombre de la categoría"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1.5">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="input-base resize-none"
              rows={3}
              placeholder="Descripción opcional"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.activa}
              onChange={(e) => setForm({ ...form, activa: e.target.checked })}
              className="w-4 h-4 rounded accent-primary-600"
            />
            <span className="text-sm text-neutral-600">Categoría activa</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Categoría"
        message="¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer."
      />
    </div>
  );
}
