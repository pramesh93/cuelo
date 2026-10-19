// Keep transcript timestamps on the audio timeline, excluding the paused gap.
// A mixed result may contain words from before Pause; never pass those on.
export function afterPauseBoundary(raw:Record<string,any>,floor:number):Record<string,any>|null{
 if(floor<=0)return raw;
 if(raw.type==='SpeechStarted')return Number.isFinite(raw.timestamp)&&raw.timestamp>=floor?raw:null;
 if(raw.type==='UtteranceEnd')return Number.isFinite(raw.last_word_end)&&raw.last_word_end>floor?raw:null;
 if(raw.type!=='Results')return raw;
 if(!Number.isFinite(raw.start))return null;
 if(raw.start>=floor-0.000001)return raw;
 const alternative=raw.channel?.alternatives?.[0],words=alternative?.words;
 if(!Array.isArray(words))return null;
 const fresh=words.filter((word:any)=>Number.isFinite(word.start)&&Number.isFinite(word.end)&&word.start>=floor-0.000001&&word.end>=word.start&&typeof word.word==='string');
 if(!fresh.length)return null;
 return {...raw,start:fresh[0].start,duration:fresh[fresh.length-1].end-fresh[0].start,channel:{...raw.channel,alternatives:[{...alternative,words:fresh,transcript:fresh.map((word:any)=>typeof word.punctuated_word==='string'?word.punctuated_word:word.word).join(' ')}]}};
}
