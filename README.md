# wxtm-bridge-backend

## Development

1. Create a shared Docker network (if not already created):

   ```bash
   docker network create shared-wxtm-network
   ```

2. Start the backend service:
   ```bash
   docker compose up wxtm-backend
   ```

## Upload artifacts

1. Set up AWS credentials:

   ```bash
   export AWS_ACCESS_KEY_ID="access-key"
   export AWS_SECRET_ACCESS_KEY="secret"
   export AWS_SESSION_TOKEN="session-token"
   ```

2. Set up Sentry authentication:

   ```bash
   export SENTRY_AUTH_TOKEN=xxxxx
   ```

3. Run the upload command:
   ```bash
   make upload-artifact-dev
   ```
