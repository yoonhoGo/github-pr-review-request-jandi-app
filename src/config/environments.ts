export const JANDI_WEBHOOK_URL = process.env.JANDI_WEBHOOK_URL;
export const MAP_FILE_URL = process.env.MAP_FILE_URL;

function checkEnvironment(name: string) {
  const env = process.env[name];

  if (env) { return env; }

  console.error(new Error(`${name} environment is empty`));
  process.exit(1);
}

export default {
  get JANDI_WEBHOOK_URL() {
    return checkEnvironment('JANDI_WEBHOOK_URL');
  },
  get MAP_FILE_URL() {
    return checkEnvironment('MAP_FILE_URL');
  }
}
