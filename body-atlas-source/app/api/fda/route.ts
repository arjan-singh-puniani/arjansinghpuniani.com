import { handleFDAUpdates } from '../../../lib/fda-updates';
export const dynamic='force-dynamic';
export async function GET(request:Request){return handleFDAUpdates(request);}
