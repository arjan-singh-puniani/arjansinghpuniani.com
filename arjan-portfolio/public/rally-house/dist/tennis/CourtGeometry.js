/** ITF line-layout ratios on the existing compact indoor club footprint.
 * Club units are not meters; a full regulation facility needs more run-off. */
const length = 12.8, scale = length / 23.77;
export const COURT = { centerX: 1, halfLength: length / 2, doublesHalfWidth: 10.97 * scale / 2, singlesHalfWidth: 8.23 * scale / 2, serviceDistance: 6.40 * scale, netTop: .94, baselineDepth: 6.65 };
export const COURT_MIN_X = COURT.centerX - COURT.singlesHalfWidth;
export const COURT_MAX_X = COURT.centerX + COURT.singlesHalfWidth;
export const COURT_POST_MIN_X = COURT.centerX - COURT.doublesHalfWidth - .914 * scale;
export const COURT_POST_MAX_X = COURT.centerX + COURT.doublesHalfWidth + .914 * scale;
