// Local Node feasibility probe for a conventional host such as Koyeb.
// Fake backend/upstream only. No production auth, provider credentials or deployment.
import {createServer} from 'node:http';
import {WebSocket,WebSocketServer} from 'ws';
export async function startNodeProbe(backend) {
  let owner=null;
  const sockets=new WebSocketServer({noServer:true,maxPayload:65536});
  const server=createServer((_req,res)=>res.writeHead(200).end('isolated local probe'));
  server.on('upgrade',(req,socket,head)=>{
    if(owner){socket.end('HTTP/1.1 409 Conflict\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');return;}
    sockets.handleUpgrade(req,socket,head,peer=>{
      const call={peer,up:[],finished:false,starting:false,active:false,deadline:0,bytes:0,timers:[]};owner=call;
      function end(reason){if(call.finished)return;call.finished=true;call.active=false;for(const timer of call.timers)clearTimeout(timer);for(const ws of [...call.up,peer]){if(ws.readyState===WebSocket.CONNECTING)ws.terminate();else if(ws.readyState===WebSocket.OPEN)ws.close(1000,reason);setTimeout(()=>{if(ws.readyState!==WebSocket.CLOSED)ws.terminate();},300).unref();}if(owner===call)owner=null;}
      async function lease(){if(call.finished)return;try{const r=await fetch(backend+'/lease',{signal:AbortSignal.timeout(300)});if(!r.ok)return end('lease failed');if(!(await r.json()).allowed)return end('revoked');}catch{return end('backend failed');}if(!call.finished)call.timers.push(setTimeout(lease,100));}
      async function message(data,binary){if(call.finished)return;if(!binary){const m=JSON.parse(data.toString());if(m.type==='stop'||m.type==='pause')return end(m.type);if(m.type!=='start'||call.starting||call.active)throw Error('invalid control');call.starting=true;const r=await fetch(backend+'/claim',{method:'POST',body:JSON.stringify({ticket:m.ticket}),signal:AbortSignal.timeout(300)});if(!r.ok)throw Error('denied');const {deadline}=await r.json();if(call.finished)return;if(!Number.isFinite(deadline)||deadline<=Date.now())throw Error('expired');call.deadline=deadline;call.timers.push(setTimeout(()=>end('deadline'),Math.max(0,deadline-Date.now())));for(let channel=0;channel<2;channel++){if(call.finished)return;const upstream=new WebSocket(backend.replace(/^http/,'ws')+'/upstream?channel='+channel);call.up.push(upstream);upstream.on('close',()=>end('provider closed'));upstream.on('error',()=>end('provider failed'));await new Promise((resolve,reject)=>{upstream.once('open',resolve);upstream.once('error',reject);upstream.once('close',()=>reject(Error('closed')));});}if(call.finished)return;call.active=true;call.started=Date.now();call.timers.push(setTimeout(lease,100));peer.send('ready');return;}if(!call.active)return end('not admitted');if(Date.now()>=call.deadline)return end('deadline');if(data.byteLength>6400)return end('oversize');call.bytes+=data.byteLength;if(call.bytes>64000*(Date.now()-call.started)/1000+6400)return end('too fast');for(const ws of call.up){if(ws.bufferedAmount>128000)return end('slow provider');ws.send(data);}}
      peer.on('message',(data,binary)=>{message(data,binary).catch(()=>end('failure'));});peer.on('close',()=>end('browser closed'));peer.on('error',()=>end('browser failed'));call.timers.push(setTimeout(()=>{if(!call.active)end('not admitted');},2000));
    });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return {base:`ws://127.0.0.1:${server.address().port}`,async dispose(){owner?.peer.terminate();sockets.close();await new Promise(resolve=>server.close(resolve));}};
}
