import PageHeader from "@/components/PageHeader";
import ProductManager from "@/components/ProductManager";
import { isManager, requireUser } from "@/lib/session";
import { readDb } from "@/lib/db";
import { isSold } from "@/lib/metrics";

export const metadata = { title: "Produtos" };

export default async function ProductsPage() {
  const me = await requireUser();
  const db = await readDb();
  const sold: Record<string, { qty: number; value: number }> = {};
  for (const v of db.visits) {
    if (!isSold(v) || !v.sale) continue;
    for (const it of v.sale.items) {
      if (!it.productId) continue;
      const s = (sold[it.productId] ??= { qty: 0, value: 0 });
      s.qty += it.quantity;
      s.value += it.quantity * it.unitPrice;
    }
  }
  return (
    <>
      <PageHeader title="Catálogo de produtos" subtitle="Produtos usados nos pedidos registrados pelas visitas" />
      <ProductManager products={db.products} canEdit={isManager(me)} sold={sold} />
    </>
  );
}
