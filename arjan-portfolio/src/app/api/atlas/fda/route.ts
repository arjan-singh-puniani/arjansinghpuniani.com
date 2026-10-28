import { handleFDAUpdates } from '../../../../../../body-atlas-source/lib/fda-updates';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(request:Request){return handleFDAUpdates(request);}
