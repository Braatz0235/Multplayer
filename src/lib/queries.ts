import type { Category, DB, Service } from "./types";

export interface GroupedServices {
  category: Category;
  services: Service[];
}

export function getGroupedServices(db: DB): GroupedServices[] {
  const categories = [...db.categories].sort((a, b) => a.order - b.order);
  const services = db.services
    .filter((s) => s.active)
    .sort((a, b) => a.order - b.order);

  return categories
    .map((category) => ({
      category,
      services: services.filter((s) => s.categoryId === category.id),
    }))
    .filter((g) => g.services.length > 0);
}
