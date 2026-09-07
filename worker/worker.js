const ALLOWED_CATEGORIES = new Set(['Personal Growth','Student Experiences','Career & Challenges','Relationships','Life Experiences','Overcoming Difficulties','Lessons Learned','Inspirational Stories']);
const cors=(env)=>({'Access-Control-Allow-Origin':env.ALLOWED_ORIGIN||'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'});
const json=(data,status,env)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json;charset=UTF-8',...cors(env)}});
const clean=(v,max)=>String(v??'').replace(/[\u0000-\u001F\u007F]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const wordCount=(v)=>clean(v,50000).match(/\S+/g)?.length||0;

export default {
 async fetch(request,env){
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:cors(env)});
  if(request.method!=='POST') return json({error:'Method not allowed.'},405,env);
  try{
   const body=await request.json();
   if(clean(body.website,100)) return json({error:'Invalid submission.'},400,env); // honeypot
   const title=clean(body.title,100), author=clean(body.author||'Anonymous',60)||'Anonymous', category=clean(body.category,80), country=clean(body.country,60), content=clean(body.content,50000);
   const count=wordCount(content);
   if(!title||!ALLOWED_CATEGORIES.has(category)||count<1||count>500) return json({error:'Invalid story. Title/category are required and content must be 1–500 words.'},400,env);
   if(!env.GITHUB_TOKEN||!env.GITHUB_OWNER||!env.GITHUB_REPO) return json({error:'Storage server is not configured.'},500,env);
   const branch=env.GITHUB_BRANCH||'main', path=env.GITHUB_FILE_PATH||'data/stories.json';
   const url=`https://api.github.com/repos/${encodeURIComponent(env.GITHUB_OWNER)}/${encodeURIComponent(env.GITHUB_REPO)}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(branch)}`;
   const ghHeaders={'Authorization':`Bearer ${env.GITHUB_TOKEN}`,'Accept':'application/vnd.github+json','User-Agent':'Humraz-Stories-Worker','X-GitHub-Api-Version':'2022-11-28'};
   let lastError='';
   for(let attempt=0;attempt<3;attempt++){
    const current=await fetch(url,{headers:ghHeaders});
    if(!current.ok) return json({error:'Unable to read story storage.'},502,env);
    const file=await current.json();
    let stories; try{stories=JSON.parse(atob(file.content.replace(/\n/g,'')))}catch{return json({error:'Story storage file is invalid JSON.'},500,env)}
    if(!Array.isArray(stories)) stories=[];
    const normalized=content.toLowerCase().replace(/\s+/g,' ').trim();
    if(stories.some(s=>String(s.content||'').toLowerCase().replace(/\s+/g,' ').trim()===normalized)) return json({error:'This story has already been submitted.'},409,env);
    const story={id:`story-${Date.now()}-${crypto.randomUUID().slice(0,8)}`,title,author,category,country,date:new Date().toISOString().slice(0,10),content};
    stories.unshift(story);
    const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(stories,null,2))));
    const put=await fetch(url,{method:'PUT',headers:{...ghHeaders,'Content-Type':'application/json'},body:JSON.stringify({message:`Add Humraz story: ${title.slice(0,60)}`,content:encoded,sha:file.sha,branch})});
    if(put.ok) return json({ok:true,story},201,env);
    lastError=`GitHub update failed (${put.status})`;
    if(put.status!==409&&put.status!==422) break;
   }
   return json({error:lastError||'Unable to save story.'},502,env);
  }catch(error){return json({error:'Invalid request or storage error.'},500,env)}
 }
};
