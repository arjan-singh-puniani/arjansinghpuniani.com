import {describe,it,expect} from 'vitest';import {renderScale} from '../public/pit-stop-lab/render-scale.js';
describe('3D render budget',()=>{
 it('caps actual drawing pixels on Retina and large displays',()=>{for(const [w,h,dpr] of [[1440,943,2],[2560,1440,2],[3840,2160,2],[390,700,3]]){const s=renderScale(w,h,dpr);expect(w*h*s*s).toBeLessThanOrEqual(1_600_001);expect(s).toBeGreaterThan(0);expect(s).toBeLessThanOrEqual(Math.min(1.5,dpr));}});
 it('keeps native resolution for ordinary desktop viewports and bounds software rendering',()=>{expect(renderScale(1200,800,1)).toBe(1);expect(renderScale(390,700,3,true)).toBe(1);});
 it('handles a hidden stage before its first layout',()=>{expect(renderScale(0,0,2)).toBe(1);});
});
