/**
 * Condition Action
 *
 * config shape:
 * {
 *   field: "status",          // key to look up in context
 *   operator: "equals",       // equals | not_equals | contains | greater_than | less_than
 *   value: "active"           // value to compare against
 * }
 *
 * Returns: { branch: "true" } or { branch: "false" }
 */

const OPERATORS = {
  equals:        (a, b) => String(a) === String(b),
  not_equals:    (a, b) => String(a) !== String(b),
  contains:      (a, b) => String(a).toLowerCase().includes(String(b).toLowerCase()),
  greater_than:  (a, b) => parseFloat(a) > parseFloat(b),
  less_than:     (a, b) => parseFloat(a) < parseFloat(b),
};

async function execute(config, context = {}) {
  const { field, operator, value } = config;

  if (!field || !operator) {
    throw new Error("Condition requires 'field' and 'operator'");
  }

  const fn = OPERATORS[operator];
  if (!fn) {
    throw new Error(`Unknown operator: ${operator}. Valid: ${Object.keys(OPERATORS).join(", ")}`);
  }

  // look up the field in context (supports dot notation: "body.status")
  const actual = field.split(".").reduce((obj, key) => obj?.[key], context);

  const result = fn(actual, value);

  console.log(`Condition [${field} ${operator} ${value}] => ${result} (actual: ${actual})`);

  return { branch: result ? "true" : "false" };
}

module.exports = { execute };
