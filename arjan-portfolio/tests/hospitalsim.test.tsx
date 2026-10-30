import {describe,it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,act,cleanup} from '@testing-library/react';
import HospitalPage from '@/app/playground/hospitalsim/page';
import {getProject} from '@/content/projects';
import fs from 'node:fs';
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
describe('hospitalSIM portfolio integration',()=>{
 it('launches on demand and preserves the standalone science route',()=>{render(<HospitalPage/>);expect(screen.getByRole('button',{name:'Play hospitalSIM'})).toBeInTheDocument();expect(document.querySelector('iframe')).toBeNull();expect(screen.getByRole('link',{name:'Standalone REPLISOME'})).toHaveAttribute('href','/playground/replisome');expect(fs.existsSync('public/replisome/index.html')).toBe(true)});
 it('fits the complete mobile game height and cleans up its observer',()=>{
  Object.defineProperty(HTMLElement.prototype,'scrollIntoView',{configurable:true,value:vi.fn()});let resize=()=>{};const disconnect=vi.fn();vi.stubGlobal('ResizeObserver',class {constructor(callback:()=>void){resize=callback}observe(){}disconnect=disconnect});
  const {unmount}=render(<HospitalPage/>);fireEvent.click(screen.getByRole('button',{name:'Play hospitalSIM'}));const frame=document.querySelector('iframe')!;frame.contentDocument!.write('<!doctype html><html><body></body></html>');vi.spyOn(frame.contentDocument!.body,'getBoundingClientRect').mockReturnValue({height:1180} as DOMRect);fireEvent.load(frame);act(()=>resize());expect(frame.parentElement?.style.getPropertyValue('--hospital-height')).toBe('1182px');unmount();expect(disconnect).toHaveBeenCalledOnce();vi.unstubAllGlobals();
 });
 it('keeps project claims within recorded evidence',()=>{const project=getProject('hospitalsim');expect(project?.status).toBe('Prototype');expect(project?.role).toContain('AI assistance');expect(project?.limitations?.join(' ')).toContain('No clinician or educator review');expect(fs.existsSync('public/hospitalsim/index.html')).toBe(true)})
});
