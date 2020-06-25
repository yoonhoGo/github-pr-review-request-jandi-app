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
  },
  get ADMIN_JANDI_EMAIL() {
    return checkEnvironment('ADMIN_JANDI_EMAIL');
  },
  get DISABLE_DELAY() {
    return !!process.env.DISABLE_DELAY;
  },
  get INTERVAL_TIME() {
    const intervalTime = process.env.INTERVAL_TIME;
    const oneHour = 60 * 60 * 1000;

    return intervalTime ? parseInt(intervalTime, 10) : oneHour;
  },
}
