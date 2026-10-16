import {useEffect,useState} from 'react';
export function SignInLoader({message='Getting your quiet corner ready…'}:{message?:string}){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{const timer=setTimeout(()=>setVisible(true),250);return()=>clearTimeout(timer);},[]);
 return <main className="signin-progress" aria-busy="true">{visible&&<div role="status" aria-live="polite"><img src="/favicon.png" alt="" width="96" height="96"/><p>{message}</p></div>}</main>;
}
