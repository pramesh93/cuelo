import Google from "@auth/core/providers/google";
import {convexAuth} from "@convex-dev/auth/server";

import {authReturnUrl} from "./authReturnPolicy";

export const {auth,signIn,signOut,store,isAuthenticated}=convexAuth({providers:[Google],callbacks:{redirect:async({redirectTo})=>authReturnUrl(redirectTo,process.env.CONVEX_CLOUD_URL!,process.env.SITE_URL!)}});
