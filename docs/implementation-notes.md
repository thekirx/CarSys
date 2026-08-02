# Implementation Notes

## Playwright lifecycle on Windows

Playwright's `webServer` command launches through a Windows shell wrapper. When
the wrapper is terminated, its Node child can remain running, leaving
`pnpm test:e2e` unable to exit reliably.

The E2E suite therefore uses Playwright `globalSetup` to build the app and run
Next.js in production mode in-process. Its teardown closes the HTTP server and
the Next app. This has been verified by a standalone `pnpm test:e2e` run: both
Desktop Chrome and Pixel 7 pass, the command exits successfully, and port 3000
is released afterward.

The production build makes E2E runs slower. Replace this setup only when a
development-server lifecycle is equally reliable across platforms: it must
start reliably, pass both configured browser projects, exit cleanly, and
release port 3000.
