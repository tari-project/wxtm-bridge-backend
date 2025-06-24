import * as Sentry from '@sentry/nestjs';

import config from '../config/config';

Sentry.init({
  dsn: config().sentryDsn,
  sendDefaultPii: true,
  attachStacktrace: true,
});
