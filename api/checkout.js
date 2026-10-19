// Vercel Serverless Function — UMY SET 01 Checkout.
// Activation deliberately blocked until all real launch settings are provided.
const SIZES = new Set(['XS','S','M','L','XL']);
export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if(request.method !== 'POST') return response.status(405).json({error:'Méthode non autorisée'});
  const live = process.env.UMY_LIVE_CHECKOUT_ENABLED === 'true';
  if(!live && process.env.UMY_TEST_CHECKOUT_ENABLED !== 'true') return response.status(503).json({error:'Paiement non activé'});
  const secret = process.env.STRIPE_SECRET_KEY;
  const price = live ? process.env.STRIPE_LIVE_PRICE_ID : process.env.STRIPE_PRICE_ID;
  const publicUrl = process.env.UMY_SITE_URL;
  if(!secret || !price || !publicUrl) return response.status(503).json({error:'Configuration de paiement incomplète'});
  if(live) {
    if(!secret.startsWith('sk_live_') || price !== 'price_1USDYsDPF7nqy2Ih6r9nhNSg') return response.status(503).json({error:'Paramètres Stripe réels non validés'});
    if(!process.env.UMY_LIVE_SHIPPING_DESCRIPTION || !process.env.UMY_LIVE_DELIVERY_ESTIMATE) return response.status(503).json({error:'Livraison réelle non configurée'});
  } else if(!secret.startsWith('sk_test_')) return response.status(503).json({error:'Clé Stripe Sandbox requise pour les essais'});
  const {legging,brassiere} = request.body || {};
  if(!SIZES.has(legging) || !SIZES.has(brassiere)) return response.status(400).json({error:'Tailles invalides'});
  let base;
  try {base = new URL(publicUrl); if(base.protocol!=='https:') throw Error('HTTPS requis');}
  catch{return response.status(503).json({error:'Adresse du site non configurée'});}
  // Configure STRIPE_PRICE_ID with the final TTC price in Stripe and
  // STRIPE_SHIPPING_RATE_ID with the confirmed delivery charge. Shipping France only.
  const params = new URLSearchParams();
  params.set('mode','payment');
  params.set('line_items[0][price]',price);
  params.set('line_items[0][quantity]','1');
  params.set('shipping_options[0][shipping_rate_data][type]','fixed_amount');
  params.set('shipping_options[0][shipping_rate_data][fixed_amount][amount]','0');
  params.set('shipping_options[0][shipping_rate_data][fixed_amount][currency]','eur');
  params.set('shipping_options[0][shipping_rate_data][display_name]',live ? process.env.UMY_LIVE_SHIPPING_DESCRIPTION : 'Livraison test (0 €)');
  params.set('shipping_address_collection[allowed_countries][0]','FR');
  params.set('billing_address_collection','required');
  params.set('phone_number_collection[enabled]','true');
  params.set('metadata[legging_size]',legging);
  params.set('metadata[bra_size]',brassiere);
  params.set('metadata[collection]','UMY BLACK - SET 01');
  if(live) params.set('metadata[delivery_estimate]',process.env.UMY_LIVE_DELIVERY_ESTIMATE);
  params.set('payment_intent_data[metadata][legging_size]',legging);
  params.set('payment_intent_data[metadata][bra_size]',brassiere);
  params.set('success_url',new URL('/?checkout=return&session_id={CHECKOUT_SESSION_ID}',base).href);
  params.set('cancel_url',new URL('/?checkout=cancel',base).href);
  try {
    const stripeResponse=await fetch('https://api.stripe.com/v1/checkout/sessions',{
      method:'POST',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/x-www-form-urlencoded'},body:params
    });
    const data=await stripeResponse.json();
    if(!stripeResponse.ok || !data.url) return response.status(502).json({error:'Création du paiement impossible'});
    return response.status(200).json({url:data.url});
  } catch {
    return response.status(502).json({error:'Service de paiement temporairement indisponible'});
  }
}
