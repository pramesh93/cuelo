import {cronJobs} from 'convex/server';
import {internal} from './_generated/api';
const crons=cronJobs();
crons.interval('remove expired temporary sources',{minutes:1},internal.sources.cleanup,{});
crons.interval('remove abandoned document uploads',{minutes:1},internal.sourceUploads.cleanup,{});
export default crons;
