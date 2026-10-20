import { createHmac, timingSafeEqual } from 'node:crypto';

// Stripe requires untouched raw payload for signature validation.
export const config = { api: { bodyParser: false } };

async function readRaw(stream) {
 const chunks=[];
 for await(const chunk of stream) chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk));
 return Buffer.concat(chunks);
}
function validSignature(raw,header,secret) {
 if(!header||!secret)return false;
 const parts=header.split(',').map(s=>s.trim().split('='));
 const t=parts.find(x=>x[0]==='t')?.[1];
 const sigs=parts.filter(x=>x[0]==='v1').map(x=>x[1]);
 if(!t||!/^\d+$/.test(t)||Math.abs(Date.now()/1000-Number(t))>300)return false;
 const expected=createHmac('sha256',secret).update(t+'.').update(raw).digest('hex');
 return sigs.some(sig=>{
  if(!/^[\da-f]{64}$/i.test(sig))return false;
  return timingSafeEqual(Buffer.from(sig,'hex'),Buffer.from(expected,'hex'));
 });
}
export default async function handler(req,res) {
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'Méthode non autorisée'});
 const key=process.env.STRIPE_SECRET_KEY;
 const secret=process.env.STRIPE_WEBHOOK_SECRET;
 const live=process.env.UMY_LIVE_CHECKOUT_ENABLED==='true';
 if(!(live?key?.startsWith('sk_live_'):key?.startsWith('sk_test_'))||!secret?.startsWith('whsec_'))return res.status(503).json({error:'Webhook Stripe non configuré'});
 let body;
 try{body=await readRaw(req);}catch{return res.status(400).end();}
 if(body.length>1024*1024)return res.status(413).end();
 if(!validSignature(body,req.headers['stripe-signature'],secret))return res.status(400).json({error:'Signature Stripe invalide'});
 let event;
 try{event=JSON.parse(body.toString('utf8'));}catch{return res.status(400).end();}
 if(event.livemode!==live)return res.status(400).end();
 if(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded'){
  const session=event.data?.object;
  if(session?.mode==='payment'&&session?.payment_status==='paid'&&session?.metadata?.collection==='UMY BLACK - SET 01') {
   // No database is connected yet. Do not report an order as recorded.
   // Stripe retains payment session, customer and legging/bra metadata.
   console.info(live?'UMY LIVE checkout paid':'UMY TEST checkout paid', {event:event.id,session:session.id,legging:session.metadata.legging_size,brassiere:session.metadata.bra_size});
  }
 }
 return res.status(200).json({received:true});
}
