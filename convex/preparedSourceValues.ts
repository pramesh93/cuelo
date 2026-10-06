import {v} from "convex/values";

export const sourceValue = v.object({
  title:v.string(),url:v.string(),passages:v.array(v.object({id:v.number(),section:v.string(),text:v.string()})),
});
export const sourceTicketValue = v.object({id:v.id("preparedSources"),secret:v.string()});
