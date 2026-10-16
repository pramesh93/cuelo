import {useEffect} from 'react';
import {useConvexAuth} from 'convex/react';
import {Home} from './Home';
import {Workspace} from './Workspace';

export function HomeEntry(){
 const {isLoading,isAuthenticated}=useConvexAuth();
 const signedIn=!isLoading&&isAuthenticated;
 useEffect(()=>{
  if(signedIn){const url=new URL(location.href);url.searchParams.set('view','home');url.hash='';history.replaceState({},'',url.pathname+url.search);}
 },[signedIn]);
 return signedIn?<Workspace/>:<Home/>;
}
