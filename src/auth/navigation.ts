export function websiteReturnPath(value:unknown){
 return value==='/?view=sources'?'/?view=sources':'/?view=account';
}
export function accountLink(intent:'signup'|'login',next?:'sources'){
 return `/?view=account&intent=${intent}${next?'&next=sources':''}`;
}
