export type EstadoPago = 'PENDIENTE' | 'PARCIALMENTE_PAGADA' | 'PAGADA';

export type MetodoPago = 'EFECTIVO' | 'YAPE' | 'PLIN';

export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO';

export interface Categoria {
  id?: number;
  nombre: string;
  descripcion?: string;
  activa?: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface Producto {
  id?: number;
  nombre: string;
  descripcion?: string;
  categoria: number;
  precio_compra: string;
  precio_venta: string;
  ganancia_unitaria?: string;
  margen_ganancia?: string;
  stock: string;
  stock_minimo: string;
  stock_bajo?: boolean;
  activo?: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface ProductoNuevo {
  nombre: string;
  descripcion?: string;
  categoria: number;
  precio_venta: string;
}

export interface Proveedor {
  id?: number;
  nombre: string;
  ruc: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo?: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface DetalleCompra {
  id?: number;
  producto?: number | null;
  producto_nuevo?: ProductoNuevo;
  nombre_producto?: string;
  cantidad: string;
  precio_unitario: string;
  subtotal?: string;
}

export interface Compra {
  id?: number;
  proveedor: number;
  fecha?: string;
  total?: string;
  total_pagado?: string;
  saldo_pendiente?: string;
  estado_pago?: EstadoPago;
  observaciones?: string;
  detalles: DetalleCompra[];
}

export interface DetalleVenta {
  id?: number;
  producto: number;
  nombre_producto?: string;
  cantidad: string;
  precio_unitario?: string;
  costo_unitario?: string;
  subtotal?: string;
  ganancia?: string;
}

export interface PagoVenta {
  id?: number;
  monto: string;
  metodo: MetodoPago;
  monto_recibido: string;
  vuelto?: string;
  fecha?: string;
  referencia?: string;
  observaciones?: string;
}

export interface Venta {
  id?: number;
  fecha?: string;
  cliente_nombre?: string;
  total?: string;
  total_pagado?: string;
  saldo_pendiente?: string;
  estado_pago?: EstadoPago;
  observaciones?: string;
  detalles: DetalleVenta[];
  pagos?: PagoVenta[];
}

export interface MovimientoInventario {
  id?: number;
  producto: number;
  nombre_producto?: string;
  tipo: TipoMovimiento;
  cantidad: string;
  motivo?: string;
  referencia?: string;
  fecha?: string;
}

export interface DashboardData {
  ventas_dia?: number;
  ganancias_dia?: number;
  ventas_mes?: number;
  productos_mas_vendidos?: Array<{ producto: string; cantidad: number }>;
  metodos_pago?: Array<{ metodo: string; cantidad: number; monto: number }>;
}
