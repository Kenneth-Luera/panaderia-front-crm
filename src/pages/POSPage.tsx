import { useEffect, useState, useMemo } from 'react';
import { Search, Trash2, Minus, Plus, Package, X, CheckCircle2, ShoppingCart } from 'lucide-react';
import { api } from '@/lib/api';
import type { Producto, Categoria } from '@/types';
import { LoadingState, ErrorState } from '@/components/ui/States';

interface CartItem {
  producto: Producto;
  cantidad: string;
}

type MetodoPago = 'EFECTIVO' | 'YAPE' | 'PLIN';

export default function POSPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [cliente, setCliente] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [metodo, setMetodo] = useState<MetodoPago>('EFECTIVO');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [success, setSuccess] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [prodData, catData] = await Promise.all([
        api.get<Producto[]>('/apiProductos/productos/'),
        api.get<Categoria[]>('/apiCategorias/categorias/'),
      ]);
      setProductos(Array.isArray(prodData) ? prodData : []);
      setCategorias(Array.isArray(catData) ? catData : []);
    } catch {
      setError('No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filteredProductos = useMemo(() => {
    return productos.filter((p) => {
      const matchSearch = p.nombre.toLowerCase().includes(productSearch.toLowerCase());
      const matchCat = !categoryFilter || p.categoria === Number(categoryFilter);
      return matchSearch && matchCat && p.activo !== false;
    });
  }, [productos, productSearch, categoryFilter]);

  function addToCart(producto: Producto) {
    const existing = cart.find((c) => c.producto.id === producto.id);
    if (existing) {
      setCart(cart.map((c) =>
        c.producto.id === producto.id
          ? { ...c, cantidad: String(Number(c.cantidad) + 1) }
          : c
      ));
    } else {
      setCart([...cart, { producto, cantidad: '1' }]);
    }
  }

  function updateCartCantidad(productoId: number, cantidad: string) {
    setCart(cart.map((c) => c.producto.id === productoId ? { ...c, cantidad } : c));
  }

  function incrementCart(productoId: number) {
    const item = cart.find((c) => c.producto.id === productoId);
    if (item) updateCartCantidad(productoId, String(Number(item.cantidad) + 1));
  }

  function decrementCart(productoId: number) {
    const item = cart.find((c) => c.producto.id === productoId);
    if (item) {
      const newQty = Number(item.cantidad) - 1;
      if (newQty <= 0) {
        setCart(cart.filter((c) => c.producto.id !== productoId));
      } else {
        updateCartCantidad(productoId, String(newQty));
      }
    }
  }

  function removeFromCart(productoId: number) {
    setCart(cart.filter((c) => c.producto.id !== productoId));
  }

  function calcTotal() {
    return cart.reduce((sum, c) => sum + (Number(c.cantidad) * Number(c.producto.precio_venta) || 0), 0);
  }

  function catName(id: number) {
    return categorias.find((c) => c.id === id)?.nombre || '-';
  }

  async function handleVenta() {
    setSaving(true);
    setSuccess(false);
    try {
      const body = {
        cliente_nombre: cliente,
        observaciones: '',
        detalles: cart.map((c) => ({ producto: c.producto.id, cantidad: c.cantidad })),
      };
      const venta = await api.post<{ id?: number }>('/apiVentas/ventas/', body);
      const total = calcTotal().toFixed(2);
      await api.post(`/apiVentas/ventas/${venta.id}/pagos/`, {
        monto: total,
        metodo,
        monto_recibido: montoRecibido || total,
      });
      setSuccess(true);
      setCart([]);
      setCliente('');
      setMontoRecibido('');
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      alert('Error al procesar la venta');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const total = calcTotal();
  const vuelto = montoRecibido ? Number(montoRecibido) - total : 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full animate-fade-in">
      {/* Product browser */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Punto de Venta</h1>
          <p className="text-sm text-neutral-500 mt-1">Selecciona productos y procesa la venta</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="input-base pl-10"
            />
            {productSearch && (
              <button type="button" onClick={() => setProductSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-neutral-400 hover:bg-neutral-100">
                <X size={16} />
              </button>
            )}
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-base w-48 shrink-0">
            <option value="">Todas las categorías</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto rounded-2xl border border-neutral-100 bg-white p-3">
          {filteredProductos.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-12">No se encontraron productos</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProductos.map((p) => {
                const inCart = cart.find((c) => c.producto.id === p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addToCart(p)}
                    className={`text-left p-4 rounded-2xl border transition-all duration-200 hover:shadow-md active:scale-95 ${
                      inCart
                        ? 'border-primary-300 bg-primary-50'
                        : 'border-neutral-100 bg-white hover:border-primary-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${inCart ? 'bg-primary-100' : 'bg-neutral-50'}`}>
                        <Package size={20} className={inCart ? 'text-primary-600' : 'text-neutral-400'} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-700 truncate">{p.nombre}</p>
                        <p className="text-xs text-neutral-400 truncate">{catName(p.categoria)}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-sm font-semibold text-primary-600">S/ {Number(p.precio_venta).toFixed(2)}</span>
                          {inCart && <span className="badge bg-primary-100 text-primary-700 text-xs">{inCart.cantidad}</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cart panel */}
      <div className="w-full lg:w-96 shrink-0 flex flex-col">
        <div className="card flex flex-col h-full overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-primary-600" />
                <span className="text-sm font-semibold text-neutral-700">Carrito</span>
              </div>
              <span className="badge bg-primary-50 text-primary-700">{cart.length} items</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: '340px' }}>
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Package size={40} className="text-neutral-200 mb-3" />
                <p className="text-sm text-neutral-400">Toca un producto para agregarlo</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((c) => (
                  <div key={c.producto.id} className="flex items-center gap-2 rounded-xl bg-neutral-50 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-700 truncate">{c.producto.nombre}</p>
                      <p className="text-xs text-neutral-400">S/ {Number(c.producto.precio_venta).toFixed(2)} c/u</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => decrementCart(c.producto.id!)} className="w-7 h-7 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-colors">
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        step="0.01"
                        value={c.cantidad}
                        onChange={(e) => updateCartCantidad(c.producto.id!, e.target.value)}
                        className="w-12 text-center text-sm border border-neutral-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-primary-400"
                      />
                      <button type="button" onClick={() => incrementCart(c.producto.id!)} className="w-7 h-7 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>
                    <button type="button" onClick={() => removeFromCart(c.producto.id!)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-error-50 hover:text-error-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t border-neutral-100 p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Cliente (opcional)</label>
                <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} className="input-base text-sm" placeholder="Nombre del cliente" />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Método de pago</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['EFECTIVO', 'YAPE', 'PLIN'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMetodo(m)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                        metodo === m
                          ? 'border-primary-300 bg-primary-50 text-primary-700'
                          : 'border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50'
                      }`}
                    >
                      {m === 'EFECTIVO' ? 'Efectivo' : m === 'YAPE' ? 'Yape' : 'Plin'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Monto recibido</label>
                <input
                  type="number"
                  step="0.01"
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  className="input-base text-sm"
                  placeholder={total.toFixed(2)}
                />
              </div>

              {metodo === 'EFECTIVO' && montoRecibido && (
                <div className="rounded-lg bg-success-50 px-4 py-2 text-sm text-success-700 flex items-center justify-between">
                  <span>Vuelto</span>
                  <span className="font-semibold">S/ {vuelto.toFixed(2)}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                <span className="text-sm font-semibold text-neutral-700">Total</span>
                <span className="text-2xl font-bold text-primary-600">S/ {total.toFixed(2)}</span>
              </div>

              <button
                type="button"
                onClick={handleVenta}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-success-600 text-white text-sm font-semibold shadow-sm transition-all duration-200 hover:bg-success-700 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 size={20} />
                {saving ? 'Procesando...' : 'Vender y Cobrar'}
              </button>

              {success && (
                <div className="rounded-lg bg-success-50 px-4 py-3 text-sm text-success-700 flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 size={18} />
                  Venta procesada con exito
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
