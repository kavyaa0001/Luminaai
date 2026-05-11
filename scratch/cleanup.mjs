import fs from 'fs';
fs.rmSync('artifacts/api-server', {recursive:true, force:true});
fs.rmSync('lib/db', {recursive:true, force:true});
fs.rmSync('lib/api-client-react', {recursive:true, force:true});
fs.rmSync('lib/api-zod', {recursive:true, force:true});
