import type { User } from "../types/user";

type AnyUser = any; // Allow any shape for flexibility

export function normalizeUser(u: AnyUser): User {
  const _id = String(u._id ?? u.id ?? u.userId ?? u.uid ?? "");
  const businessId = u.businessId != null ? String(u.businessId) : undefined;

  return {
    _id,
    id: _id,                 // alias dla starego UI
    email: String(u.email ?? ""),
    name: String(u.name ?? ""),
    businessId,
    userType: u.userType || (businessId ? 'business' : 'user'),
    phone: u.phone,
    freelancerId: u.freelancerId ? String(u.freelancerId) : undefined,
    isVerified: Boolean(u.isVerified),
    isActive: Boolean(u.isActive ?? true),
    avatar: u.avatar,
    coverImage: u.coverImage,
    bio: u.bio,
    location: u.location,
    website: u.website,
    role: u.role,
  };
}