// Meeting presence, remembered sign-in and permission to capture are separate checks.
export function sidebarScreen(input:{checking:boolean;meeting:boolean;authLoading:boolean;authenticated:boolean;accessLoading:boolean}){
 if(input.checking)return 'checking-meeting';
 if(!input.meeting)return 'no-meeting';
 if(input.authLoading)return 'checking-account';
 if(!input.authenticated)return 'sign-in';
 if(input.accessLoading)return 'checking-access';
 return 'setup';
}
export function startBlock(input:{eligible:boolean;invited:boolean;enabled:boolean;busy:boolean;mode:'generic'|'document'|null;sourceSelected:boolean;sourceLoading:boolean}){
 if(input.busy)return 'Connecting…';
 if(!input.eligible)return 'Join a Meet call before starting Cuelo.';
 if(!input.invited)return 'Your account needs invited tester access before listening can start.';
 if(!input.enabled)return 'Live listening is not enabled for this test account yet.';
 if(!input.mode)return 'Choose how Cuelo should answer.';
 if(input.mode==='document'&&input.sourceLoading)return 'Your source is still loading.';
 if(input.mode==='document'&&!input.sourceSelected)return 'Choose a ready source to enable Start.';
 return null;
}
