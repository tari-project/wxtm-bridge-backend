### To update package

1. **Start Nest application**

   ```sh
   docker compose up wxtm-backend
   ```

2. **Generate package from root directory**

   ```sh
   npm run api:generate
   ```

3. **Change directory**

   ```sh
   cd wxtm-bridge-backend-api-node
   ```

4. **Bump version, build, and publish package**

   ```sh
   npm run release
   ```
