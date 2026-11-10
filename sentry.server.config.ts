import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Never send cookies, headers, or query strings. The query string can carry OAuth codes.
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
      delete event.request.query_string;
    }
    if (event.user) {
      event.user = { id: event.user.id };
    }
    return event;
  },
});
