import {spawnSync} from 'node:child_process';
import {readFileSync,readdirSync,writeFileSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';

const result=spawnSync('npm',['ls','--omit=dev','--all','--parseable'],{encoding:'utf8',shell:false});
if(result.status!==0)throw new Error('Cannot enumerate installed runtime dependencies');
const paths=result.stdout.trim().split('\n').filter(p=>p&&resolve(p)!==process.cwd());
const notices=['Third-party runtime dependency notices\nGenerated from the installed, locked production dependency tree.\nThese packages retain their respective licenses and copyright notices.\nDevelopment-tool distributions retain their own upstream notices.'];
for(const path of paths){
  const pkg=JSON.parse(readFileSync(join(path,'package.json'),'utf8'));
  const files=readdirSync(path).filter(name=>/^(license|licence|copying)(\..*)?$/i.test(name));
  if(!files.length)throw new Error(`Missing upstream license text for ${pkg.name}`);
  notices.push(`\n${'='.repeat(72)}\n${pkg.name} ${pkg.version} — ${pkg.license||'See upstream text'}\n${files.map(name=>readFileSync(join(path,name),'utf8')).join('\n')}`);
}
mkdirSync('public',{recursive:true});
writeFileSync('public/THIRD-PARTY-NOTICES.txt',notices.join('\n').trimEnd()+'\n');
writeFileSync('public/LICENSE.txt',readFileSync('LICENSE','utf8'));
console.log(`Preserved runtime license texts for ${paths.length} installed dependency distributions`);
