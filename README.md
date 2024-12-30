# BanyanProxy

BanyanProxy is a high-performance, multi-worker HTTP proxy server built with Node.js and TypeScript. It supports worker pool management for efficient handling of requests and can dynamically route requests to upstream services based on configurable rules.

## Features

- **Worker Pool Management**: Uses Node.js `cluster` module to create multiple workers for handling requests in parallel, ensuring scalability.
- **Dynamic Routing**: Routes incoming requests to different upstream services based on configurable path rules.
- **Configurable**: All rules, upstreams, and other settings are configurable through a central configuration file.
- **Fallback Handling**: If no matching rule is found, it falls back to the default `/` rule.

