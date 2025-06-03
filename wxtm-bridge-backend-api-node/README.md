### To update package

1. **Change version of the package**

   ```sh
   npm version patch # or minor/major
   ```

2. **Make a commit matching version**

   ```sh
   git ci -am "@tari-project/wxtm-bridge-backend-api-node@0.1.21
   ```

3. **Make a matching tag**

   ```sh
   git tag @tari-project/wxtm-bridge-backend-api-node@0.1.21
   ```

4. **Push to github with tags**

   ```sh
   git push
   git puhs --tags
   ```

5. **Create a release**

    https://github.com/tari-project/wxtm-bridge-backend/releases/new
