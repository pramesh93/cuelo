// Temporary scheduling only. Transcript text stays in the existing call backend.
export class QuestionQueue<T,R> {
 private detecting:T[]=[];private answering:{turn:T;question:string}[]=[];
 private active=false;private version=0;private detectorBusy=false;private answerBusy=false;
 constructor(private work:{detect:(turn:T)=>Promise<{status:'question'|'skipped'|'cancelled';question:string}>;answer:(turn:T)=>Promise<R>;display:(result:R)=>void;failure:(error:unknown)=>void;changed:(state:{checking:number;questions:string[];answering:boolean})=>void}){}
 add(turn:T){this.detecting.push(turn);this.notify();this.pump();}
 resume(){this.active=true;this.pump();}
 pause(){this.active=false;this.version++;this.notify();}
 clear(){this.pause();this.detecting=[];this.answering=[];this.notify();}
 private notify(){this.work.changed({checking:this.detecting.length,questions:this.answering.map(x=>x.question),answering:this.active&&this.answerBusy});}
 private pump(){if(!this.active)return;
  if(!this.detectorBusy&&this.detecting.length){this.detectorBusy=true;const turn=this.detecting[0],version=this.version;
   void this.work.detect(turn).then(result=>{if(version!==this.version||!this.active)return;if(result.status==='cancelled')throw Error('Question recognition stopped because the call became unavailable.');this.detecting.shift();if(result.status==='question')this.answering.push({turn,question:result.question});}).catch(error=>{if(version===this.version){this.pause();this.work.failure(error);}}).finally(()=>{this.detectorBusy=false;this.notify();this.pump();});
  }
  if(!this.answerBusy&&this.answering.length){this.answerBusy=true;const entry=this.answering[0],version=this.version;this.notify();
   void this.work.answer(entry.turn).then(result=>{if(version!==this.version||!this.active)return;this.answering.shift();this.work.display(result);}).catch(error=>{if(version===this.version){this.pause();this.work.failure(error);}}).finally(()=>{this.answerBusy=false;this.notify();this.pump();});
  }
 }
}
