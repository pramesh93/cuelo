import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";
import staticHosting from "@convex-dev/static-hosting/convex.config";
// Convex Auth requires discovery at /.well-known and callbacks at /api/auth.
const app = defineApp({ httpPrefix: "/" });
app.use(agent);
app.use(staticHosting, { httpPrefix: "/" });
export default app;
