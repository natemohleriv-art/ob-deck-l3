# Publish and update with GitHub Pages

The project includes `.github/workflows/deploy-pages.yml`. Pushes to the default
branch (`main` or `master`) run the tests, build the app, and deploy `dist` to Pages.
Deployment only proceeds if the tests and build succeed. No personal access token
or hosting secret needs to be committed; the workflow uses GitHub's scoped token.

## First publication

1. Create an empty repository named `ob-deck-l3` in the intended GitHub account.
   GitHub Free requires a public repository for Pages. Plans supporting Pages from
   private repositories can keep source private while publishing the website.
2. Connect this checkout to that repository and push the initial app source.
   Include the workflow and lockfile. Do not include `tmp`, `node_modules`, or
   original reference PDFs and screenshots from Dropbox.
3. In the repository, open **Settings → Pages → Build and deployment → Source**
   and select **GitHub Actions**.
4. Open **Actions → Test and deploy website → Run workflow** on the default branch
   if the initial push happened before Pages was enabled.
5. The successful deployment exposes the live URL in the `github-pages`
   environment and in **Settings → Pages**. Typically it is
   `https://YOUR-USERNAME.github.io/ob-deck-l3/`.

The source and app expose the modeled venue dimensions and architectural notes.
Original supplied drawings are not included in the repository's tracked files.
Uploaded visitor videos remain browser-local and are not added to GitHub.

## Push an update

From this project folder, after editing and reviewing your changes:

```powershell
npm test
npm run build
git add src public vite.config.ts
git diff --cached
git commit -m "Update the previsualization"
git push
```

Stage other intended files explicitly when needed. If editing on a feature
branch, merge into the default branch to deploy. Monitor the Actions run to see
the test/build/deploy result. You do not need to keep a local development server
running for the public site.

The build uses relative asset URLs and the sample video uses Vite's BASE_URL, so
the same deployment works under a repository path or at a custom-domain root.
Configure a custom domain later through GitHub Pages settings and your DNS
provider; no custom domain is required to launch.

References:
- https://vite.dev/guide/static-deploy.html#github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
