import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from '../api/contact.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, 'site');
const fetchText = async name => readFile(path.join(site,name),'utf8');

test('all pages and source assets exist', async () => {
 for (const file of ['index.html','about/index.html','programs/index.html','families/index.html','contact/index.html','privacy/index.html','404.html','assets/styles.css','assets/app.js','assets/hero-play.svg','assets/playbook.svg','assets/school-bus.svg','assets/sandys-original-logo.png']) {
  assert.ok((await stat(path.join(site,file))).isFile(),file);
 }
});
test('public facts and contact routes stay consistent', async () => {
 for(const f of ['index.html','about/index.html','programs/index.html','families/index.html','contact/index.html']) {
  const html = await fetchText(f);
  assert.match(html,/580\D*776\D*2221/);
  assert.match(html,/\/contact\//);
  assert.match(html,/<main\b/);
  assert.match(html,/<title>/);
 }
 assert.match(await fetchText('families/index.html'), /5:30 AM/);
 assert.match(await fetchText('programs/index.html'), /Preschool/);
 assert.match(await fetchText('index.html'), /K830058326/);
});
test('contact form is accessible, no public API key, and responsive', async () => {
 const html = await fetchText('contact/index.html');
 assert.match(html,/id="contact-form"/);
 for (const id of ['parent-name','parent-email','inquiry-topic','inquiry-message','form-status']) assert.ok(html.includes(`id="${id}"`), id);
 assert.doesNotMatch(html,/WEB3FORMS_ACCESS_KEY/);
 assert.doesNotMatch(html,/"access_key"/);
 const css = await fetchText('assets/styles.css');
 assert.match(css,/max-width:540px/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/\[hidden\]\{display:none!important\}/);
});
function mockRes(){ return { statusCode:200, headers:{}, body:null, setHeader(k,v){this.headers[k]=v;}, status(code){this.statusCode=code;return this;}, json(obj){this.body=obj;return this;} }; }
const good = {name:'Parent Person',email:'parent@example.com',phone:'580-555-1234',ageGroup:'Infant (0-11 months)',interest:'Care availability',message:'I would like to ask if care is available next month.'};
test('API rejects GET and malformed requests', async () => {
 let res=mockRes();await handler({method:'GET'},res);assert.equal(res.statusCode,405);
 res=mockRes();await handler({method:'POST',body:'not json'},res);assert.equal(res.statusCode,400);
 res=mockRes();await handler({method:'POST',body:{...good,email:'not-an-email'}},res);assert.equal(res.statusCode,400);
 res=mockRes();await handler({method:'POST',body:{...good,interest:'Not valid'}},res);assert.equal(res.statusCode,400);
 res=mockRes();await handler({method:'POST',body:{...good,message:'short'}},res);assert.equal(res.statusCode,400);
 res=mockRes();await handler({method:'POST',body:{...good,message:'x'.repeat(9100)}},res);assert.equal(res.statusCode,413);
});
test('API does not claim delivery without a configured key', async () => {
 const orig=process.env.WEB3FORMS_ACCESS_KEY;
 delete process.env.WEB3FORMS_ACCESS_KEY;
 const res=mockRes();await handler({method:'POST',body:good},res);
 assert.equal(res.statusCode,503);
 assert.equal(res.body.success,false);
 if(orig)process.env.WEB3FORMS_ACCESS_KEY=orig;
});
test('API honeypot returns success without email', async () => {
 let called=false;const original=globalThis.fetch;globalThis.fetch=async()=>{called=true;throw Error('unexpected');};
 const res=mockRes();await handler({method:'POST',body:{...good,website:'spam.example'}},res);
 assert.equal(res.statusCode,200);assert.equal(called,false);globalThis.fetch=original;
});
test('API only acknowledges upstream-confirmed success; full inquiry is sent',async()=>{
 const origKey=process.env.WEB3FORMS_ACCESS_KEY;const origFetch=globalThis.fetch;
 process.env.WEB3FORMS_ACCESS_KEY='local-test-key';
 let data;globalThis.fetch=async(_url,options)=>{data=JSON.parse(options.body);return{ok:true,status:200,json:async()=>({success:true})};};
 const res=mockRes();await handler({method:'POST',body:good},res);
 assert.equal(res.statusCode,200);assert.equal(res.body.success,true);
 assert.equal(data.access_key,'local-test-key');assert.equal(data.email,good.email);
 assert.match(data.message,/Care availability/);assert.match(data.message,/Infant/);assert.match(data.message,/next month/);
 assert.ok(!JSON.stringify(res.body).includes('local-test-key'));
 globalThis.fetch=async()=>({ok:true,status:200,json:async()=>({success:false})});
 const res2=mockRes();await handler({method:'POST',body:good},res2);
 assert.equal(res2.statusCode,502);
 globalThis.fetch=async()=>({ok:false,status:429,json:async()=>({success:false})});
 const res3=mockRes();await handler({method:'POST',body:good},res3);
 assert.equal(res3.statusCode,429);
 globalThis.fetch=origFetch;
 if(origKey)process.env.WEB3FORMS_ACCESS_KEY=origKey;else delete process.env.WEB3FORMS_ACCESS_KEY;
});
