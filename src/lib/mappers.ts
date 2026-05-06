import { Order, Product } from "../app/types";

export function mapProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    buyingPrice: Number(row.buying_price || 0),
    price: Number(row.selling_price || 0),
    quantity: Number(row.quantity || 0),
    image: row.image || undefined,
    widthCm: row.width_cm == null ? undefined : Number(row.width_cm),
    heightCm: row.height_cm == null ? undefined : Number(row.height_cm),
  };
}

export function mapOrder(row: any): Order {
  return {
    id: row.id,
    customer: row.customer,
    phone: row.phone || undefined,
    address: row.address || undefined,
    items: (row.order_items || []).map((item: any) => ({
      productId: item.product_id,
      productName: item.product_name,
      quantity: Number(item.quantity || 0),
      price: Number(item.price || 0),
      total: Number(item.total || 0),
    })),
    subtotal: Number(row.subtotal || 0),
    deliveryCost: Number(row.delivery_cost || 0),
    total: Number(row.total || 0),
    status: row.status,
    date: row.order_date,
  };
}

export function toProductRow(product: Omit<Product, "id"> & { id?: string }, userId?: string) {
  return {
    ...(product.id ? { id: product.id } : {}),
    name: product.name,
    sku: product.sku,
    category: product.category,
    buying_price: product.buyingPrice || 0,
    selling_price: product.price,
    quantity: product.quantity,
    image: product.image || null,
    width_cm: product.widthCm || null,
    height_cm: product.heightCm || null,
    updated_by: userId,
    ...(product.id ? {} : { created_by: userId }),
  };
}
