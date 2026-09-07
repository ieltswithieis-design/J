// Secure server-side endpoint template. NEVER put your GitHub token in browser code.
export default async function handler(req,res){
 if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
 const {title,author='Anonymous',category,country='',content}=req.body||{};
 const words=String(content||'').trim().split(/\s+/).filter(Boolean);
 if(!title||!category||!content||words.length>500) return res.status(400).json({error:'Invalid story. Maximum 500 words.'});
 // Use GitHub API here with process.env.GITHUB_TOKEN.
 // Recommended workflow: create a pending JSON file or Pull Request for moderation.
 return res.status(200).json({ok:true,message:'Validated. Connect GitHub API commit workflow here.'});
}