---
project: "Portfel Bez Spiny"
researched_at: 2026-10-02
recommended_platform: Cloudflare Pages
runner_up: Netlify
context_type: mvp
tech_stack:
  language: TypeScript 5.7
  framework: Angular 19.2 + Ionic 8.8 + Capacitor 8.5
  runtime: Browser-delivered static SPA
  backend: Supabase Auth and Postgres (planned in the PRD)
---

## Recommendation

**Deploy the web application on Cloudflare Pages.**

Cloudflare Pages and Netlify tied on the five platform criteria. Netlify was initially ranked first for its direct Angular guidance and polished deploy workflow, but the user selected Cloudflare after reviewing the risks. Cloudflare fits this static Angular app, leaves auth and persistence with the already-selected Supabase backend, and does not charge for static asset requests. The user's answers also favor DX, do not require persistent processes or global latency, and allow external services. Pages hosts the web SPA; Android/iOS builds continue through the existing Capacitor path.

## Platform Comparison

Scores are heuristic: Pass = 1, Partial = 0.5, Fail = 0. No candidate failed the app's runtime constraint. Interview answers break ties in favor of low setup effort and managed static hosting; the user has only older Heroku experience and no current cloud-platform preference.

| Platform | CLI-first | Managed / serverless | Agent-readable docs | Stable deploy API | MCP / integration | Total |
|---|---|---|---|---|---|---:|
| Cloudflare Pages / Workers | Pass | Pass | Pass | Pass | Pass | 5 |
| Netlify | Pass | Pass | Pass | Pass | Pass | 5 |
| Vercel | Pass | Pass | Pass | Pass | Partial | 4.5 |
| Railway | Pass | Pass | Partial | Pass | Pass | 4.5 |
| Render | Partial | Pass | Partial | Pass | Pass | 4 |
| Fly.io | Pass | Pass | Pass | Pass | Partial | 4.5 |

**Cloudflare Pages / Workers.** Pages has Angular deployment guidance, GitHub and GitLab integration with preview deployments, Wrangler CLI uploads, a REST API, and documented production rollbacks. Static asset requests are free and unlimited; at 10k–100k monthly static requests, the request charge is therefore $0. The Free plan has a separate monthly build limit, and Pages Functions or Workers add separate usage charges. Cloudflare publishes Markdown and `llms.txt` documentation. Workers can run request handlers and WebSockets, but the selected static Pages deployment needs neither. Cloudflare offers co-located KV, D1, R2, and Queues, though Supabase remains the PRD choice. Cloudflare's product MCP servers are official; MCP server portals became generally available on 2026-09-24. Pages API and rollback documentation is live, but does not label the features' lifecycle stage separately. An Angular application-builder output-directory issue was reported against Wrangler 4.136.3 on 2026-09-22, so configure the browser directory explicitly rather than trusting auto-detection.

**Netlify.** Netlify documents Angular auto-detection, branch deploy previews, CLI deployment and deploy management, and an official MCP server. Its managed static hosting is a good framework fit and its previews make review straightforward. Netlify Functions are serverless, not an always-on process, while Netlify also supplies storage-oriented managed services. Credit-based billing means that request count alone cannot establish the cost at 10k–100k visits: transfer size, build activity, and other metered usage matter. Netlify's MCP and Angular documentation are available, but the MCP server's GA/beta lifecycle was not stated in the sources checked on 2026-10-02. Its main trade-offs here are the less predictable credit model and another provider boundary alongside Supabase.

**Vercel.** Vercel documents Angular deployment, a mature CLI, preview deployments, production promotion and rollback, and a deployment API. Static assets are managed, while serverless functions do not provide a general always-on process; storage is available through Vercel products and integrations. Plan eligibility and cost depend on the account's use case and metered resources; compare the current plan against actual asset transfer rather than request count alone. Vercel publishes agent-readable docs and an official MCP integration. The evaluation criteria mark that MCP integration OAuth-backed and beta as of 2026; it is treated as Partial. Vercel's strongest framework-specific advantage is less decisive for an Angular SPA than for a framework-native Vercel workload.

**Railway.** Railway has an Angular deployment guide, CLI, deployment actions, usage-based plans, and an official MCP server. It supports persistent services and co-located databases, but neither is needed because this client is static and Supabase is already chosen. Its pricing combines a base plan and resource usage, so a deployed container adds cost and operational surface without product value; 10k–100k request counts alone are insufficient to estimate its compute and egress charges. Railway's official docs and Angular guide are available; the agent-readable-docs score is Partial because a consistent Markdown/LLM-doc surface was not confirmed in this research. The MCP server's lifecycle status was not explicitly labelled in the official documentation checked on 2026-10-02.

**Render.** Render offers free static-site hosting, Git-based deploys, a deploy API/hooks, and an official MCP server. It can also run persistent services and managed databases, which are unnecessary for this app. Static-site publishing is free, but outbound bandwidth counts against workspace plan limits; the transfer volume, not just a 10k–100k request count, determines whether a plan limit is reached. The official docs are readable but no comparable `llms.txt` or broad Markdown source was confirmed, giving it a Partial documentation score. The official MCP server is documented, with no beta/preview lifecycle label found as of 2026-10-02. Its API and MCP can support scripted operations, but the CLI does not cover the full maintenance loop as cleanly as the top candidates.

**Fly.io.** Fly.io's static-site guide packages the site into a deployable image, while `flyctl` handles deployment and machine operations. It supports managed Machines, persistent processes, WebSockets, global regions, and managed Postgres, but those strengths are outside this static SPA's needs. Usage-based Machines, network and storage billing make cost depend on the running image and configuration, rather than static request count. Fly publishes agent-readable documentation and documents an `flyctl` MCP server; the MCP lifecycle was not explicitly labelled in the sources checked on 2026-10-02. The additional container and machine operations create more operational work than a static-hosting service.

### Shortlisted Platforms

#### 1. Cloudflare Pages (Selected)

Static hosting, Angular guidance, Wrangler, REST API rollbacks, and free static asset requests fit the workload without adding a server runtime. The user chose this option after the Angular auto-detection, preview/auth, logging, and API-permission risks were made explicit.

#### 2. Netlify

Netlify is a close fit with particularly clear Angular and deploy-preview guidance, plus an official MCP server. It remains the runner-up because the credit-based pricing model is less predictable from visit counts alone.

#### 3. Vercel

Vercel has a strong CLI, preview, and rollback workflow and supports Angular. The criteria's beta label for its MCP integration and usage-based pricing make it the third choice for this app.

## Anti-Bias Cross-Check: Cloudflare Pages

### Devil's Advocate — Weaknesses

1. Angular output auto-detection has a recent failure report: issue [#15783](https://github.com/cloudflare/workers-sdk/issues/15783) names Wrangler 4.136.3 and the Angular application builder (reported 2026-09-22). A deployment may succeed while publishing the wrong directory. Set `dist/cost-management-app/browser` explicitly and test the built site.
2. Pages preview URLs are distinct origins. Supabase Auth redirect URLs and any origin checks can reject preview logins or become too permissive if configured with broad wildcards.
3. Wrangler Pages projects have different Git-integrated and Direct Upload setup paths. Cloudflare documents that a Git-integrated project cannot later be switched to Direct Upload. Choose the intended path before creating the project.
4. The official Cloudflare MCP/API surface can manage account resources, not only inspect them. A broadly scoped credential can make production changes. Keep credentials narrowly scoped and require approval for production writes.

### Pre-Mortem — How This Could Fail

Six months after launch, the team concludes that Cloudflare was the wrong choice. The first mistake was trusting the build preset: Wrangler's Angular output detection picked the parent output directory instead of the browser assets, so deployment checks passed but deep links returned errors. The team patched settings manually and never added a repeatable smoke test. Next, previews were used as if they were production. Their `pages.dev` hostnames were absent from Supabase Auth's redirect allowlist, so sign-in tests failed. To unblock testing, someone broadened the redirect pattern and preview builds started using production Supabase values. Meanwhile, an early manual upload had led the team to choose a deployment path incompatible with the Git-based workflow they later wanted. Finally, an agent received an account-wide API token to speed up deployments and could change production settings without review. A Pages rollback restored the frontend after a bad release, but could not undo a Supabase schema/data change that had shipped alongside it. These failures were preventable: explicit output paths, separate preview configuration, early project setup choices, least-privilege access, and human approval for production and database changes would have kept the platform manageable.

### Unknown Unknowns

- Angular CLI 19.2 uses the application builder. The local build currently has `dist/cost-management-app/browser`; use that exact path. The Wrangler autoconfiguration report is recent, and this research did not confirm that its fix has shipped.
- Git-integrated and Direct Upload projects have different setup constraints. Cloudflare says a Git-integrated project cannot later be switched to Direct Upload. Choose the project mode before creation.
- Cloudflare announced Pages rollbacks and API access in July 2026. The docs describe them as available but do not separately label the lifecycle stage. A frontend rollback does not revert Supabase schema changes, records, Auth configuration, or Capacitor releases.
- Static asset requests are free and unlimited, but that does not make all Cloudflare products free. Pages Functions and Workers are billed separately; adding server behavior changes the cost and runtime model.
- Static-only Pages has no application server process to tail. Build/deployment logs and Pages request analytics are different from application error logs; client-side and Supabase errors need their own observability.

## Operational Story

- **Preview deploys**: With Git integration, pushes to non-production branches receive unique preview URLs and the production branch is configurable. Require authentication for private previews. Use a non-production Supabase project or restricted test data and explicitly configure its Auth redirect URLs. If Git integration is not available for the repository, use a Direct Upload pipeline and pass a preview branch; choose the project mode up front.
- **Secrets**: Keep Cloudflare API tokens in the CI provider's secret store and scope them to the required account/project actions. The Angular build is public: only the Supabase URL and publishable key may be placed in client configuration. Never put a service-role key or deploy token in `src/`, build-time client variables, or generated assets. Rotate deployment tokens after exposure or role changes.
- **Rollback**: Restore the previous production deployment from the Pages dashboard or the documented Pages API. The Pages docs describe this as an instant rollback. It restores the web deployment only; Supabase migrations/data and native Capacitor releases need separate recovery plans.
- **Approval**: A developer must approve the initial production launch, later production releases if they change auth/data behavior, production rollback, custom-domain/DNS changes, API-token changes, and Supabase migrations. Agents may build locally and deploy branch previews when explicitly authorized; do not give unattended agents broad account-wide write credentials.
- **Logs**: For deployment metadata, use `npx wrangler pages deployment list --project-name <project-name>`. Read a deployment's build log through the documented Pages API [deployment log operation](https://developers.cloudflare.com/api/resources/pages/). A static-only Pages project has no runtime logs; `npx wrangler pages deployment tail` applies only if Pages Functions are added. See [Pages API](https://developers.cloudflare.com/pages/configuration/api/) and [Pages Functions logging](https://developers.cloudflare.com/pages/functions/debugging-and-logging/).

## Risk Register

| Risk | Source | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| Wrangler auto-detects the wrong Angular output directory | Unknown unknown / research finding | M | H | Set `dist/cost-management-app/browser` explicitly; deploy and smoke-test the output after each CLI upgrade. |
| Preview sign-in fails or previews reach production data | Devil's advocate / pre-mortem | M | H | Use a staging Supabase project, restrict preview access, and add only the required preview callback URLs. |
| Git/Direct Upload project mode blocks the desired deployment workflow | Devil's advocate / unknown unknown | L | M | Decide the deployment mode before project creation; verify Git-provider support first. |
| An API token or MCP tool makes an unintended production change | Devil's advocate | M | H | Use a project-scoped token, separate read and deploy credentials, and require human approval for production changes. |
| A frontend rollback leaves an incompatible Supabase migration or data change | Pre-mortem / unknown unknown | M | H | Use backward-compatible, staged migrations; require human approval and a separate data recovery plan. |
| Static-only deployment has no app runtime logs | Unknown unknown / research finding | M | M | Collect browser errors and use Supabase observability for backend/auth failures; don't treat build logs as runtime telemetry. |
| Adding Pages Functions changes expected cost and operating model | Research finding | L | M | Keep the MVP static and Supabase-backed; re-evaluate billing and logging before adding server functions. |

## Getting Started

1. Confirm the repository's remote provider and choose Git integration (for branch previews) or Direct Upload before creating the Pages project. Cloudflare supports GitHub and GitLab integration; a Git-integrated project cannot later be switched to Direct Upload.
2. Add Wrangler locally with `npm install --save-dev wrangler` and commit the resulting lockfile so CI and local deploys use the same resolved CLI version.
3. Run `npm run build`, then preview the static output with `npx wrangler pages dev dist/cost-management-app/browser`.
4. Create the Pages project with production branch and preview access controls. Set the build command to `npm run build` and output directory to `dist/cost-management-app/browser`. For Git integration, deploy by pushing the chosen production branch; for Direct Upload, deploy with `npx wrangler pages deploy dist/cost-management-app/browser --project-name <project-name>`.
5. Smoke-test the deployed root route, a refreshed nested route, and Supabase sign-in/redirects on both production and preview URLs. Keep the native build on the existing Capacitor process.

## Sources

- [Project PRD](prd.md) and [stack assessment](stack-assessment.md)
- [Cloudflare Angular deployment guide](https://developers.cloudflare.com/pages/framework-guides/deploy-an-angular-site/)
- [Cloudflare Wrangler docs](https://developers.cloudflare.com/workers/wrangler/) and [Pages direct upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Pages build and plan limits](https://developers.cloudflare.com/pages/platform/limits/) and [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Pages previews](https://developers.cloudflare.com/pages/configuration/preview-deployments/), [Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/), [rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/), and [REST API](https://developers.cloudflare.com/pages/configuration/api/)
- [Cloudflare MCP server repository](https://github.com/cloudflare/mcp) and [MCP portals GA notice](https://developers.cloudflare.com/changelog/post/2026-09-24-mcp-portals-ga/)
- [Netlify Angular guide](https://docs.netlify.com/build/frameworks/framework-setup-guides/angular/), [Netlify pricing](https://www.netlify.com/pricing/), and [official Netlify MCP](https://docs.netlify.com/build/build-with-ai/netlify-mcp-server/)
- [Vercel Angular](https://vercel.com/solutions/angular), [Vercel CLI](https://vercel.com/docs/cli), and [pricing](https://vercel.com/pricing)
- [Railway Angular guide](https://docs.railway.com/guides/angular), [pricing](https://docs.railway.com/pricing/plans), and [official MCP](https://docs.railway.com/ai/mcp-server)
- [Render static sites](https://render.com/docs/static-sites), [pricing](https://render.com/pricing), and [official MCP](https://render.com/docs/mcp-server)
- [Fly.io static-site guide](https://fly.io/docs/languages-and-frameworks/static/), [pricing](https://fly.io/pricing/), and [flyctl MCP](https://fly.io/docs/mcp/flyctl-server/)
- Search results included independent 2025–2026 comparisons, but their pricing snapshots were treated as secondary context; current platform documentation and pricing pages were used for the scores and operational claims. A request-only cost estimate is not reliable for competitors whose bills depend on asset transfer, deployment/build volume, plan eligibility, or running compute.

## Out of Scope

The following were not evaluated in this research:

- Docker image configuration
- CI/CD pipeline setup
- Production-scale architecture (multi-region, HA, DR)
