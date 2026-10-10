export type AuthReply={redirect?:string;verifier?:string;tokens?:{token:string;refreshToken:string}|null;started?:boolean};
export type AuthArgs={provider?:string;params?:Record<string,unknown>;verifier?:string;refreshToken?:string};
export async function signInThroughPopup(options:{args:AuthArgs;call:(args:AuthArgs)=>Promise<AuthReply>;popup:(redirect:string,nonce:string)=>Promise<string>;nonce:()=>string}):Promise<AuthReply>{
 if(options.args.provider!=='google'||options.args.params?.code!==undefined)return options.call(options.args);
 const nonce=options.nonce();const started=await options.call({...options.args,params:{...options.args.params,redirectTo:`/?view=extension-auth&state=${encodeURIComponent(nonce)}`}});
 if(!started.redirect)return started;
 if(typeof started.verifier!=='string'||!started.verifier)throw Error('Google sign-in could not start safely.');
 const code=await options.popup(started.redirect,nonce);
 if(!code||code.length>2048)throw Error('Google sign-in did not return a valid code.');
 const completed=await options.call({params:{code},verifier:started.verifier});
 if(completed.redirect||!completed.tokens?.token||!completed.tokens.refreshToken)throw Error('Google sign-in did not complete. Try again.');
 return completed;
}
