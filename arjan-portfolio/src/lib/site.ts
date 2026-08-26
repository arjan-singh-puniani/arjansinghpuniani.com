export const siteUrl = "https://arjansinghpuniani.com";
export const absoluteUrl = (path = "") => new URL(path, siteUrl).toString();
