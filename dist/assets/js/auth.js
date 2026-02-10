// Lightweight Netlify Identity helpers.
// NOTE: Requires the Netlify Identity widget script on pages that use this.

export function getIdentity() {
  return window.netlifyIdentity || null;
}

export function initIdentity() {
  const identity = getIdentity();
  if (!identity) return null;

  // Ensure widget is initialized.
  try {
    identity.init();
  } catch {
    // noop
  }
  return identity;
}

export function currentUser() {
  const identity = getIdentity();
  return identity ? identity.currentUser() : null;
}

export async function requireLogin({ redirectTo = "/app/" } = {}) {
  const identity = initIdentity();
  if (!identity) {
    throw new Error("Netlify Identity widget not loaded.");
  }

  const user = identity.currentUser();
  if (user) return user;

  // Open the widget and redirect after login.
  return await new Promise((resolve) => {
    const onLogin = (u) => {
      identity.off("login", onLogin);
      resolve(u);
      window.location.href = redirectTo;
    };
    identity.on("login", onLogin);
    identity.open();
  });
}

export async function getAccessToken() {
  const user = currentUser();
  if (!user) return null;
  // gotrue-js provides jwt() for a fresh token
  try {
    return await user.jwt();
  } catch {
    // Fallback: may exist on token object
    return user?.token?.access_token || null;
  }
}

export function logout({ redirectTo = "/" } = {}) {
  const identity = getIdentity();
  if (!identity) return;
  identity.logout();
  window.location.href = redirectTo;
}

export function onAuthChange(cb) {
  const identity = initIdentity();
  if (!identity) return () => {};

  const handler = (user) => cb(user);
  identity.on("login", handler);
  identity.on("logout", handler);
  identity.on("init", handler);
  return () => {
    identity.off("login", handler);
    identity.off("logout", handler);
    identity.off("init", handler);
  };
}
