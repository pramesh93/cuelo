import {useEffect,useRef,useState} from 'react';
import {useConvexAuth,useQuery} from 'convex/react';
import {api} from '../convex/_generated/api';
import {SignInLoader} from './SignInLoader';
import {useAuthActions,useAuthToken} from './auth/SharedAuth';
import {websiteReturnPath} from './auth/navigation';
import {SignInPage} from './SignInPage';
import {Workspace,type WorkspacePage} from './Workspace';

export function Account({returnToSources=false,workspacePage='home'}:{returnToSources?:boolean;workspacePage?:WorkspacePage}){
 const {signIn}=useAuthActions();const token=useAuthToken();const {isLoading,isAuthenticated}=useConvexAuth();const access=useQuery(api.callAccess.status,!isLoading&&!isAuthenticated?{}:'skip');const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const params=new URLSearchParams(typeof location==='undefined'?'':location.search),signup=params.get('intent')==='signup';const destination=websiteReturnPath(returnToSources||params.get('next')==='sources'?'/?view=sources':undefined);
 const googleReturn=useRef(params.has('code'));
 const [returningFromGoogle,setReturningFromGoogle]=useState(()=>params.has('code'));
 useEffect(()=>{if(isAuthenticated){setReturningFromGoogle(false);setBusy(false);}},[isAuthenticated]);
 async function login(){setBusy(true);setError('');try{const result=await signIn('google',{redirectTo:new URL(destination,location.origin).href});if(!result.signingIn&&!result.redirect)setBusy(false);}catch{setError('We couldn’t sign you in. Please try again.');setBusy(false);}}
 if(!isLoading&&isAuthenticated)return <Workspace initialPage={returnToSources?'content':workspacePage} signingIn={googleReturn.current||busy}/>;
 if(params.has('code')||returningFromGoogle&&isLoading||!!token)return <SignInLoader message={params.has('code')||returningFromGoogle?'Signing you in…':'Getting your quiet corner ready…'}/>;
 return <SignInPage signup={signup} returnToSources={returnToSources||params.get('next')==='sources'} ready={!isLoading&&!!access?.googleConfigured} unavailable={!isLoading&&access!==undefined&&!access.googleConfigured} busy={busy} error={error||(returningFromGoogle?'Your sign-in did not complete. Please try again.':'')} onLogin={()=>void login()}/>;
}
