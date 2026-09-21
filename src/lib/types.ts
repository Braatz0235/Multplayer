export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export interface BusinessHours {
  day: Weekday;
  closed: boolean;
  open: string; // "09:00"
  close: string; // "19:00"
}

export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number; // in BRL
  durationMinutes: number;
  image: string | null;
  active: boolean;
  order: number;
}

export interface Settings {
  siteName: string;
  handle: string;
  tagline: string;
  bio: string;
  since: string;
  address: string;
  mapQuery: string;
  phone: string; // display format
  whatsapp: string; // digits only, with country code, e.g. 5562992258031
  instagram: string;
  rating: number;
  reviewsCount: number;
  followers: number;
  following: number;
  profileImage: string;
  coverImage: string;
  logoImage: string;
  primaryColor: string;
  accentColor: string;
}

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  date: string; // "2025-06-20"
  time: string; // "14:30"
  customerName: string;
  customerPhone: string;
  notes: string;
  status: BookingStatus;
  createdAt: string;
}

export interface AdminUser {
  email: string;
  passwordHash: string;
  name: string;
}

export interface DB {
  settings: Settings;
  categories: Category[];
  services: Service[];
  hours: BusinessHours[];
  bookings: Booking[];
  admin: AdminUser | null;
}
