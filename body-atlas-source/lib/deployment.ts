// The hosted snapshot lives beside the portfolio, under its own asset prefix.
export const atlasBasePath = process.env.NEXT_PUBLIC_ATLAS_BASE_PATH || "";
export const atlasPath = (path: string) => `${atlasBasePath}${path}`;
