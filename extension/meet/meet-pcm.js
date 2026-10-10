// Live PCM only; bounded 50ms blocks. Never records audio or plays it back.
class CueloLivePcm extends AudioWorkletProcessor {
 constructor(){super();this.ratio=sampleRate/16000;this.remaining=this.ratio;this.sum=0;this.buffer=new ArrayBuffer(1600);this.view=new DataView(this.buffer);this.offset=0;}
 process(inputs){const mono=inputs[0]?.[0];if(!mono)return true;for(const value of mono){let weight=1;while(weight>0){const used=Math.min(weight,this.remaining);this.sum+=value*used;this.remaining-=used;weight-=used;if(this.remaining<.000001){const v=Math.max(-1,Math.min(1,this.sum/this.ratio));this.view.setInt16(this.offset*2,Math.round(v*(v<0?32768:32767)),true);this.offset++;this.remaining=this.ratio;this.sum=0;if(this.offset===800){this.port.postMessage(this.buffer,[this.buffer]);this.buffer=new ArrayBuffer(1600);this.view=new DataView(this.buffer);this.offset=0;}}}}return true;}
}
registerProcessor('cuelo-live-pcm',CueloLivePcm);
