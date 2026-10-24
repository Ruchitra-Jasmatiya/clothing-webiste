# Owner admin (/admin) – one-time setup (about 5 minutes)

1. Vercel dashboard -> your project -> **Storage** -> **Create** -> **Blob** -> make it a **Public** store -> connect it to this project.
   (This adds `BLOB_READ_WRITE_TOKEN` automatically.)
2. Project -> **Settings -> Environment Variables** -> add `ADMIN_PASSWORD` = a strong password only the owner knows.
3. Push this code to GitHub (Vercel redeploys), or **Deployments -> Redeploy** after adding the variables.
4. Open `https://your-site.vercel.app/admin`, log in, done.

Owner use: pick a category -> edit name/price, tick "New", tap the picture to change it,
Delete, "+ Add images", "+ Category" -> press **Save changes**. The shop updates within seconds.

Until the first Save the shop shows the built-in products (src/data/defaultCatalog.json), so nothing breaks.
