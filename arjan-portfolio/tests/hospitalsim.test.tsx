import {describe,it,expect} from 'vitest';
import {render,screen} from '@testing-library/react';
import HospitalPage from '@/app/playground/hospitalsim/page';
import {getProject} from '@/content/projects';
import fs from 'node:fs';
describe('hospitalSIM portfolio integration',()=>{
 it('launches on demand and preserves the standalone science route',()=>{render(<HospitalPage/>);expect(screen.getByRole('button',{name:'Play hospitalSIM'})).toBeInTheDocument();expect(document.querySelector('iframe')).toBeNull();expect(screen.getByRole('link',{name:'Standalone REPLISOME'})).toHaveAttribute('href','/playground/replisome');expect(fs.existsSync('public/replisome/index.html')).toBe(true)});
 it('keeps project claims within recorded evidence',()=>{const project=getProject('hospitalsim');expect(project?.status).toBe('Prototype');expect(project?.role).toContain('AI assistance');expect(project?.limitations?.join(' ')).toContain('No clinician or educator review');expect(fs.existsSync('public/hospitalsim/index.html')).toBe(true)})
});
