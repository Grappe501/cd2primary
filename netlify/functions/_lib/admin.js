import { json, requireUser } from "./team.js";

function parseList(value) {
  return String(value || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function getAdminAllowlist() {
  const emails = parseList(process.env.ADMIN_EMAILS);
  const subs = parseList(process.env.ADMIN_SUBS);
  return { emails, subs };
}

export function isAdminUser(user) {
  const { emails, subs } = getAdminAllowlist();
  const email = String(user?.email || "").toLowerCase();
  const sub = String(user?.sub || "").toLowerCase();

  if (emails.length === 0 && subs.length === 0) return false;
  if (emails.includes(email)) return true;
  if (subs.includes(sub)) return true;
  return false;
}

export function requireAdmin(context) {
  const auth = requireUser(context);
  if (!auth.ok) return auth;

  const isAdmin = isAdminUser(auth.user);
  if (!isAdmin) {
    return { ok: false, response: json(403, { error: "Forbidden" }) };
  }
  return { ok: true, user: auth.user };
}
