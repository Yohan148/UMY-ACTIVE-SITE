// Verify a completed Stripe Sandbox Checkout Session server-side.
// A redirect alone never proves a payment succeeded.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Méthode non autorisée'});
 const key=process.env.STRIPE_SECRET_KEY;
 const id=String(req.query?.session_id||'');
 if(!key?.startsWith('sk_test_')||!/^cs_test_[a-zA-Z0-9]+$/.test(id))return res.status(400).json({error:'Session de test invalide'});
 try{
  const result=await fetch('https://api.stripe.com/v1/checkout/sessions/'+encodeURIComponent(id),{headers:{Authorization:'Bearer '+key}});
  if(!result.ok)return res.status(502).json({error:'Vérification indisponible'});
  const session=await result.json();
  if(session.mode!=='payment'||session.livemode!==false)return res.status(400).json({error:'Session non conforme'});
  const success=session.payment_status==='paid';
  return res.status(200).json({paid:success,reference:session.id.slice(-12),legging:session.metadata?.legging_size||null,brassiere:session.metadata?.bra_size||null});
 }catch{return res.status(502).json({error:'Vérification temporairement indisponible'});}
}
