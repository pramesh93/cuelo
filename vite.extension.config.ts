import {defineConfig,loadEnv} from 'vite';import {writeFileSync} from 'node:fs';import {extensionEnvironment} from './extension/environment';
export default defineConfig(({mode})=>{
 const env=loadEnv(mode,process.cwd(),'');const {backend,siteOrigin,returnOrigin}=extensionEnvironment({...env,...process.env});
 return {define:{'import.meta.env.VITE_CONVEX_URL':JSON.stringify(backend),'process.env.NODE_ENV':JSON.stringify('production')},build:{outDir:'extension/meet',emptyOutDir:false,minify:true,lib:{entry:process.env.CUELO_EXTENSION_ENTRY==='call'?'extension/src/offscreen.tsx':'extension/src/main.tsx',formats:['es'],fileName:()=>process.env.CUELO_EXTENSION_ENTRY==='call'?'call.js':'auth-check.js'},rollupOptions:{output:{codeSplitting:false}}},plugins:[{name:'cuelo-auth-config',writeBundle(){writeFileSync('extension/meet/auth-config.js',`export const authConfig=${JSON.stringify({siteOrigin,returnOrigin})};\n`);}}]};
});
