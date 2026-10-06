import {httpRouter} from "convex/server";
import {auth} from "./auth";
import {upload,options} from "./sourceUploadHttp";
const http=httpRouter();
http.route({path:"/sources/upload",method:"POST",handler:upload});
http.route({path:"/sources/upload",method:"OPTIONS",handler:options});
auth.addHttpRoutes(http);
export default http;
