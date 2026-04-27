const axios = require("axios");
const { URL } = require("url");
const dns = require("dns").promises;

const BLOCKED_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/
];

async function validateUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https protocols are allowed");
  }

  // resolve hostname and check it doesn't point to internal IP
  const addresses = await dns.lookup(parsed.hostname, { all: true }).catch(() => {
    throw new Error("Could not resolve hostname");
  });

  for (const { address } of addresses) {
    if (BLOCKED_RANGES.some((re) => re.test(address))) {
      throw new Error(`Requests to internal addresses are not allowed`);
    }
  }
}

async function execute(config) {
  const { url, method = "GET", body = {} } = config;

  if (!url) throw new Error("url is required");

  await validateUrl(url);

  const response = await axios({
    url,
    method: method.toLowerCase(),
    data: body,
    timeout: 10000,
    maxRedirects: 3
  });

  return response.data;
}

module.exports = { execute };
