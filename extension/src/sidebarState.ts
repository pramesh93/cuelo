// Meeting presence, remembered sign-in and permission to capture are separate checks.
export function sidebarScreen(input:{checking:boolean;meeting:boolean;authLoading:boolean;authenticated:boolean;accessLoading:boolean}){
 if(input.authLoading)return 'checking-account';
 if(!input.authenticated)return 'sign-in';
 if(input.checking)return 'checking-meeting';
 if(!input.meeting)return 'no-meeting';
 if(input.accessLoading)return 'checking-access';
 return 'setup';
}
export function startBlock(input:{eligible:boolean;trialExhausted:boolean;enabled:boolean;busy:boolean;mode:'generic'|'document'|null;sourceSelected:boolean;sourceLoading:boolean}){
 if(input.busy)return 'Connecting…';
 if(!input.eligible)return 'Join a Meet call before starting Cuelo.';
 if(input.trialExhausted)return 'Your free trial has ended. You’ve reached your three-call or 90-minute allowance. Paid plans are coming soon.';
 if(!input.enabled)return 'Live listening is currently unavailable. Please try again later.';
 if(!input.mode)return 'Choose how Cuelo should answer.';
 if(input.mode==='document'&&input.sourceLoading)return 'Your source is still loading.';
 if(input.mode==='document'&&!input.sourceSelected)return 'Select ready sources to enable Start.';
 return null;
}
