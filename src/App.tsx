import { useState } from 'react';
import Sidebar, { type PageKey } from '@/components/Sidebar';
import DashboardPage from '@/pages/DashboardPage';
import CategoriasPage from '@/pages/CategoriasPage';
import ProductosPage from '@/pages/ProductosPage';
import ProveedoresPage from '@/pages/ProveedoresPage';
import ComprasPage from '@/pages/ComprasPage';
import InventarioPage from '@/pages/InventarioPage';
import POSPage from '@/pages/POSPage';
import HistorialVentasPage from '@/pages/HistorialVentasPage';
import ReportesPage from '@/pages/ReportesPage';

function App() {
  const [page, setPage] = useState<PageKey>('dashboard');

  const pages: Record<PageKey, React.ReactNode> = {
    dashboard: <DashboardPage />,
    categorias: <CategoriasPage />,
    productos: <ProductosPage />,
    proveedores: <ProveedoresPage />,
    compras: <ComprasPage />,
    inventario: <InventarioPage />,
    pos: <POSPage />,
    'historial-ventas': <HistorialVentasPage />,
    reportes: <ReportesPage />,
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar current={page} onNavigate={setPage} />
      <main className="flex-1 p-6 lg:p-8 overflow-x-hidden">
        {pages[page]}
      </main>
    </div>
  );
}

export default App;
