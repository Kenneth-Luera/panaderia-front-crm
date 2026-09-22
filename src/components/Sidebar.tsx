import { LayoutDashboard, Tags, Package, Truck, ShoppingCart, Warehouse, Receipt, BarChart3, Wheat, ClipboardList, type LucideIcon } from 'lucide-react';

export type PageKey = 'dashboard' | 'categorias' | 'productos' | 'proveedores' | 'compras' | 'inventario' | 'pos' | 'historial-ventas' | 'reportes';

interface SidebarProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
}

const navItems: { key: PageKey; label: string; icon: LucideIcon }[] = [
  { key: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
  { key: 'pos', label: 'Punto de Venta', icon: ShoppingCart },
  { key: 'historial-ventas', label: 'Historial de Ventas', icon: ClipboardList },
  { key: 'categorias', label: 'Categorias', icon: Tags },
  { key: 'productos', label: 'Productos', icon: Package },
  { key: 'proveedores', label: 'Proveedores', icon: Truck },
  { key: 'compras', label: 'Compras', icon: Receipt },
  { key: 'inventario', label: 'Inventario', icon: Warehouse },
  { key: 'reportes', label: 'Reportes', icon: BarChart3 },
];

export default function Sidebar({ current, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-neutral-200/60 flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-100">
        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
          <Wheat className="text-white" size={22} />
        </div>
        <div>
          <h1 className="text-sm font-bold text-neutral-800">Panaderia</h1>
          <p className="text-xs text-neutral-400">Sistema de Gestion</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = current === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700'
              }`}
            >
              <Icon size={20} className={active ? 'text-primary-600' : 'text-neutral-400'} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="px-6 py-4 border-t border-neutral-100">
        <p className="text-xs text-neutral-400">v1.0 - Gestion integral</p>
      </div>
    </aside>
  );
}
