export function isAdminUser(user) {
  if (!user) return false;

  const role = user.app_metadata?.role;
  const roles = Array.isArray(user.app_metadata?.roles) ? user.app_metadata.roles : [];

  return role === "admin" || roles.includes("admin");
}
