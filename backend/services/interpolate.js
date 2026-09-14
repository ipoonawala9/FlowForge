/**
 * interpolate.js
 *
 * Resolves {{variable}} tokens in strings and object values against
 * the workflow's live execution context.
 *
 * Supported syntax:
 *   {{field}}           — top-level context key
 *   {{body.email}}      — nested dot-notation path
 *   {{trigger.status}}  — any depth
 *
 * Example:
 *   context = { name: "Ibrahim", body: { order_id: "ORD-42" } }
 *   interpolate("Hi {{name}}, your order {{body.order_id}} is ready", context)
 *   => "Hi Ibrahim, your order ORD-42 is ready"
 */

/**
 * Resolve a dot-notation path against an object.
 * Returns undefined if the path doesn't exist.
 */
function getPath(obj, path) {
  return path.split(".").reduce((curr, key) => curr?.[key], obj);
}

/**
 * Interpolate all {{...}} tokens in a string.
 * Unresolved tokens are left as-is (so broken configs are obvious, not silent).
 */
function interpolateString(str, context) {
  if (typeof str !== "string") return str;
  return str.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const val = getPath(context, path.trim());
    // keep the token if not found, so users can see what's wrong
    return val !== undefined && val !== null ? String(val) : match;
  });
}

/**
 * Deep-walk a config object and interpolate every string value.
 * Handles nested objects and arrays.
 */
function interpolateConfig(config, context) {
  if (config === null || config === undefined) return config;

  if (typeof config === "string") {
    return interpolateString(config, context);
  }

  if (Array.isArray(config)) {
    return config.map((item) => interpolateConfig(item, context));
  }

  if (typeof config === "object") {
    const result = {};
    for (const [key, value] of Object.entries(config)) {
      result[key] = interpolateConfig(value, context);
    }
    return result;
  }

  // numbers, booleans — return as-is
  return config;
}

module.exports = { interpolateConfig, interpolateString, getPath };