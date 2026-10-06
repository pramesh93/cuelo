import {v} from 'convex/values';
export const sourceKind=v.union(v.literal('text'),v.literal('webpage'),v.literal('pdf'),v.literal('docx'));
export const passageValue=v.object({ordinal:v.number(),reference:v.string(),text:v.string()});
export const sourceContentValue=v.object({title:v.string(),kind:sourceKind,url:v.union(v.string(),v.null()),pageCount:v.union(v.number(),v.null()),passages:v.array(passageValue)});
export const sourceMetaValue=v.object({id:v.id('sources'),title:v.string(),kind:sourceKind,url:v.union(v.string(),v.null()),pageCount:v.union(v.number(),v.null()),passageCount:v.number(),saved:v.boolean(),expiresAt:v.union(v.number(),v.null())});
export const sourceScopeArgs={guestSecret:v.optional(v.string())};
export const expectedSource=v.union(v.id('sources'),v.null());
export type SourcePassage={ordinal:number;reference:string;text:string};
export type SourceContent={title:string;kind:'text'|'webpage'|'pdf'|'docx';url:string|null;pageCount:number|null;passages:SourcePassage[]};
