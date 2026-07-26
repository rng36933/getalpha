import * as Sentry from "@sentry/nextjs";
import { sharedOptions } from "@/lib/observability/sentry-options";

/**
 * Browser error reporting.
 *
 * Deliberately narrow. Session replay is not enabled and never should be here:
 * it records the DOM, and the DOM on the journal page is somebody's entry
 * price, stop loss and account balance. Masking would be one configuration
 * mistake away from recording all of it.
 *
 * Breadcrumbs record that an input was changed, never what was typed.
 */
Sentry.init({
  ...sharedOptions,
  integrations: [
    Sentry.breadcrumbsIntegration({
      // Console output is where debugging values end up, and this app logs
      // provider payloads.
      console: false,
      dom: { serializeAttribute: [] },
    }),
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
