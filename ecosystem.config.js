/**
 * pm2 processes for the customer storefront — four of the sixteen Cartzii
 * deployments.
 *
 * Layout, ports and process names follow section 04 of the deployment runbook
 * (cartzii-api-server/docs/architecture/deployment-runbook.md). Each slot is a
 * separate checkout:
 *
 *   /srv/cartzii/prod/ca/marketplace  →  cartzii-prod-ca-marketplace  :4001
 *   /srv/cartzii/prod/us/marketplace  →  cartzii-prod-us-marketplace  :4011
 *   /srv/cartzii/qa/ca/marketplace    →  cartzii-qa-ca-marketplace    :4101
 *   /srv/cartzii/qa/us/marketplace    →  cartzii-qa-us-marketplace    :4111
 *
 * All four are declared here, but a checkout only ever runs its own:
 *
 *   cd /srv/cartzii/prod/ca/marketplace
 *   npm run build:prod:ca
 *   pm2 start ecosystem.config.js --only cartzii-prod-ca-marketplace
 *
 * next.config.ts sets `output: "standalone"`, so the server to run is the one
 * Next emits at .next/standalone/server.js — not `next start`. That server does
 * NOT bundle static assets, which is what `build:{env}:{country}` copies in via
 * `standalone:assets`. Skipping it yields a site that boots and 404s every
 * stylesheet and image.
 *
 * The per-slot build is not optional either: NEXT_PUBLIC_* values are inlined
 * into the bundle at BUILD time, so a bundle built for QA keeps calling the QA
 * API whatever pm2 puts in the environment.
 */

const fs = require('fs');
const path = require('path');

/**
 * Minimal `.env` reader — deliberately dependency-free so this config parses
 * before `npm ci` has run, which is when pm2 deploy hooks tend to read it.
 * Missing file is not an error: pm2 lists all four slots on every host, but
 * only one slot's env file exists in any given checkout.
 */
function readEnvFile(file) {
  const full = path.join(__dirname, file);
  if (!fs.existsSync(full)) return {};

  const out = {};
  for (const raw of fs.readFileSync(full, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    // Strip one layer of matching quotes, then a trailing `# comment`.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '');
    }

    out[key] = value;
  }
  return out;
}


const SLOTS = [
  { env: 'prod', country: 'ca', port: 4001 },
  { env: 'prod', country: 'us', port: 4011 },
  { env: 'qa',   country: 'ca', port: 4101 },
  { env: 'qa',   country: 'us', port: 4111 },
];

module.exports = {
  apps: SLOTS.map(({ env, country, port }) => {
    const name = `cartzii-${env}-${country}-marketplace`;

    return {
      name,
      script: '.next/standalone/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',

      env: {
        ...readEnvFile(`.env.${env}.${country}`),
        // Last word on all three, so a stale env file cannot bind the wrong
        // port or expose the process beyond the loopback interface.
        NODE_ENV: 'production',
        PORT: port,
        // MUST be 0.0.0.0, not 127.0.0.1 — however tempting loopback looks.
        //
        // Next's standalone server derives the request URL from HOSTNAME when
        // it is a concrete address. Set to 127.0.0.1 it stops honouring the
        // Host header, so next-intl's locale rewrite becomes the absolute
        // `https://localhost:PORT/en-CA` instead of the relative `/en-CA`.
        // Next then proxies to itself over TLS on a plaintext port and every
        // page 500s:
        //
        //   Failed to proxy https://localhost:4101/en-CA
        //   Error: write EPROTO ... packet length too long
        //
        // These ports are not publicly reachable anyway — the host firewall
        // drops them from outside, and nginx reaches them over loopback.
        HOSTNAME: '0.0.0.0',
      },

      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: `/var/log/pm2/${name}-error.log`,
      out_file: `/var/log/pm2/${name}-out.log`,
      merge_logs: true,

      max_memory_restart: '600M',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
    };
  }),
};
