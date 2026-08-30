/**
 * Formatted CLI Logger for create-odoo-app
 */

export const logger = {
  info: (msg: string) => console.log(`\x1b[36mℹ\x1b[0m ${msg}`),
  success: (msg: string) => console.log(`\x1b[32m✔\x1b[0m ${msg}`),
  warn: (msg: string) => console.log(`\x1b[33m⚠\x1b[0m ${msg}`),
  error: (msg: string) => console.error(`\x1b[31m✖\x1b[0m ${msg}`),
  step: (step: number, total: number, msg: string) =>
    console.log(`\x1b[34m[${step}/${total}]\x1b[0m ${msg}`),
  header: (title: string) => {
    console.log(`\n\x1b[1m\x1b[35m=== ${title} ===\x1b[0m\n`);
  },
};
