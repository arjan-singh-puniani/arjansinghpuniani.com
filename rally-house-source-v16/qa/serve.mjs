import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const port=Number(process.env.PORT??8078);
const root=path.resolve(process.argv[2]??process.cwd());
const types={'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp'};
http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',types[path.extname(file)]??'application/octet-stream');
 fs.createReadStream(file).pipe(res);
}).listen(port,'127.0.0.1',()=>console.log(`Rally House http://127.0.0.1:${port}`));
