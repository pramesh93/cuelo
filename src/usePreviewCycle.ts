import {useEffect,useRef,useState} from 'react';
// Visual previews only: no microphone, call session or provider request.
export function usePreviewCycle(durations:readonly number[],count=1){
 const root=useRef<HTMLElement|null>(null),[visible,setVisible]=useState(false),[reduced,setReduced]=useState(false),[step,setStep]=useState(0),[pageVisible,setPageVisible]=useState(()=>typeof document==='undefined'||!document.hidden);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);const observer=new IntersectionObserver(entries=>setVisible(entries.some(entry=>entry.isIntersecting)),{threshold:.2});if(root.current)observer.observe(root.current);return()=>{observer.disconnect();media.removeEventListener('change',update);};},[]);
 useEffect(()=>{const update=()=>setPageVisible(!document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
 const phase=reduced?durations.length-1:step%durations.length;
 useEffect(()=>{if(!visible||reduced||!pageVisible)return;const timer=setTimeout(()=>setStep(value=>(value+1)%(durations.length*count)),durations[phase]);return()=>clearTimeout(timer);},[visible,reduced,pageVisible,step,phase,durations,count]);
 return {root,phase,example:reduced?0:Math.floor(step/durations.length),running:visible&&!reduced&&pageVisible};
}
