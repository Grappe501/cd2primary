
// Overlay 31: Error Envelope Standardization

export function json(statusCode, payload = {}) {
  return new Response(JSON.stringify(payload), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

export function ok(data = {}) {
  return json(200, { data });
}

export function error(statusCode, code, message, details = undefined) {
  const body = {
    error: {
      code,
      message
    }
  };
  if (details !== undefined) body.details = details;
  return json(statusCode, body);
}

export function requireUser(context) {
  const user = context?.clientContext?.user;
  if (!user) {
    return {
      ok: false,
      response: error(401, "unauthorized", "Authentication required")
    };
  }
  return { ok: true, user };
}
