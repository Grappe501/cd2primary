import { json, requireUser } from "./_lib/team.js";
import { getAdminAllowlist, isAdminUser } from "./_lib/admin.js";

export default async (req, context) => {
  if (req.method !== "GET") return json(405, { error: "Method not allowed" });

  const auth = requireUser(context);
  if (!auth.ok) return auth.response;

  const allow = getAdminAllowlist();
  const isAdmin = isAdminUser(auth.user);

  return json(200, {
    user: { email: auth.user.email, sub: auth.user.sub },
    isAdmin,
    adminsConfigured: allow.emails.length > 0 || allow.subs.length > 0
  });
};
