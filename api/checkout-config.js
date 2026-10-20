// Public checkout state. Expose only readiness booleans, never credentials or values.
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Méthode non autorisée'});
 const checks={
  activation:process.env.UMY_LIVE_CHECKOUT_ENABLED==='true',
  cle_stripe_reelle:process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')===true,
  prix_109:process.env.STRIPE_LIVE_PRICE_ID==='price_1USXCEDPF7nqy2IhMkj36fDC',
  secret_webhook:process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_')===true,
  livraison_gratuite:process.env.UMY_LIVE_SHIPPING_CENTS==='0',
  libelle_livraison:!!process.env.UMY_LIVE_SHIPPING_DESCRIPTION,
  delai_livraison:!!process.env.UMY_LIVE_DELIVERY_ESTIMATE
 };
 res.status(200).json({live:Object.values(checks).every(Boolean),checks,price:109,delivery:'15 à 21 jours',shipping:'offerte en France'});
}
