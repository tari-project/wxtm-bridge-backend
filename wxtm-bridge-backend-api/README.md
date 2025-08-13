### To update package

1. **Change version of the package**

   ```sh
   npm version patch # or minor/major
   ```

2. **Make a commit matching version**

   ```sh
   git commit -m "@tari-project/wxtm-bridge-backend-api@0.1.36"
   ```

3. **Make a matching tag**

   ```sh
   git tag @tari-project/wxtm-bridge-backend-api@0.1.36
   ```

4. **Push to github with tags**

   ```sh
   git push
   git push --tags
   ```

5. **Create a release**

   https://github.com/tari-project/wxtm-bridge-backend/releases/new
