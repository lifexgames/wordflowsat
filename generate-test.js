import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
export const config={api:{bodyParser:false}};
const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
const send=(res,status,body)=>res.status(status).setHeader("Content-Type","application/json").send(JSON.stringify(body));
function parseJSON(t){const m=t.match(/\{[\s\S]*\}/);if(!m)throw new Error("AI did not return valid JSON.");return JSON.parse(m[0]);}
export default async function handler(req,res){
 if(req.method!=="POST")return send(res,405,{error:"POST only"});
 try{
  const a=req.headers.authorization||"";if(!a.startsWith("Bearer "))return send(res,401,{error:"Not authenticated."});
  const token=a.slice(7),sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{global:{headers:{Authorization:`Bearer ${token}`}}});
  const u=await sb.auth.getUser(token);if(u.error||!u.data.user)return send(res,401,{error:"Invalid session."});
  const chunks=[];for await(const c of req)chunks.push(c);const body=Buffer.concat(chunks),ct=req.headers["content-type"]||"",bm=ct.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if(!bm)return send(res,400,{error:"Invalid multipart upload."});const boundary=Buffer.from(`--${bm[1]||bm[2]}`);const parts=[];let start=0;
  while(true){const i=body.indexOf(boundary,start);if(i<0)break;if(start)parts.push(body.slice(start,i));start=i+boundary.length}
  const fields={};let file=null;
  for(let p of parts){p=p.slice(p.indexOf("\r\n")+2);const sep=p.indexOf(Buffer.from("\r\n\r\n"));if(sep<0)continue;const hs=p.slice(0,sep).toString();let v=p.slice(sep+4);if(v.slice(-2).toString()==="\r\n")v=v.slice(0,-2);const n=(hs.match(/name="([^"]+)"/i)||[])[1],fn=(hs.match(/filename="([^"]*)"/i)||[])[1];if(!n)continue;if(fn!==undefined)file={filename:fn,data:v,contentType:(hs.match(/Content-Type:\s*([^\r\n]+)/i)||[])[1]||""};else fields[n]=v.toString("utf8")}
  if(!file?.data?.length)return send(res,400,{error:"No file uploaded."});if(file.data.length>15*1024*1024)return send(res,413,{error:"File too large. Maximum is 15 MB."});
  const mode=fields.mode||"generate",type=fields.testType||"sat",count=Math.min(Math.max(parseInt(fields.questionCount||"20",10),5),44),difficulty=fields.difficulty||"Mixed",time=parseInt(fields.timeLimit||"0",10)||null,title=fields.title||file.filename.replace(/\.[^.]+$/,""),extra=fields.instructions||"";
  const prompt=mode==="convert"
   ?`You are a test digitization assistant. Convert the uploaded existing practice test into structured interactive test data. Preserve readable questions, passages, answer choices, and answer key as accurately as possible. Do not invent a different question when readable. If an answer key is absent, infer only when possible and explain. Type: ${type}. Maximum ${count} questions. Extra: ${extra||"none"}. Return JSON only: {"title":"...","questions":[{"section":"Reading and Writing" or "Math","question":"...","passage":"","options":["...","...","...","..."],"answer":0,"explanation":"..."}]}. Answer is zero-based.`
   :`Create an original SAT-style practice test based ONLY on uploaded study material. Type: ${type}. Exactly ${count} questions. Difficulty: ${difficulty}. Time: ${time||"none"}. Extra: ${extra||"none"}. Do not claim official College Board status and do not reproduce copyrighted questions verbatim. Use four choices, one correct answer, and concise explanations. Return JSON only: {"title":"...","questions":[{"section":"Reading and Writing" or "Math","question":"...","passage":"","options":["...","...","...","..."],"answer":0,"explanation":"..."}]}.`;
  let ai;const mime=(file.contentType||"").toLowerCase(),isImage=mime.startsWith("image/")||/\.(png|jpe?g|webp)$/i.test(file.filename||"");
  if(isImage){const url=`data:${mime||"image/png"};base64,${file.data.toString("base64")}`;ai=await openai.responses.create({model:process.env.OPENAI_MODEL||"gpt-5",input:[{role:"user",content:[{type:"input_text",text:prompt},{type:"input_image",image_url:url}]}]})}
  else{const up=await openai.files.create({file:new File([file.data],file.filename||"source.pdf",{type:mime||"application/octet-stream"}),purpose:"user_data"});ai=await openai.responses.create({model:process.env.OPENAI_MODEL||"gpt-5",input:[{role:"user",content:[{type:"input_text",text:prompt},{type:"input_file",file_id:up.id}]}]});try{await openai.files.delete(up.id)}catch{}}
  const data=parseJSON(ai.output_text||"");data.questions=(data.questions||[]).slice(0,count);if(!data.questions.length)throw new Error("No questions were generated or extracted.");
  const saved=await sb.from("tests").insert({user_id:u.data.user.id,title:data.title||title,source_filename:file.filename,test_type:type,difficulty:mode==="convert"?"Original":difficulty,time_limit:time,question_count:data.questions.length,questions:data.questions,status:"not_started",answers:{}}).select("id,question_count").single();
  if(saved.error)throw saved.error;return send(res,200,{test_id:saved.data.id,question_count:saved.data.question_count});
 }catch(e){console.error(e);return send(res,500,{error:e.message||"Test generation failed."})}
}