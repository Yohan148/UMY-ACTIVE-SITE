// Vercel Serverless Function — UMY SET 01 Checkout.
// Activation deliberately blocked until all real launch settings are provided.
const SIZES = new Set(['XS','S','M','L','XL']);
export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if(request.method !== 'POST') return response.status(405).json({error:'Méthode non autorisée'});
  if(process.env.UMY_PREORDERS_ENABLED !== 'true') return response.status(503).json({error:'Préventes non ouvertes'});
  const secret = process.env.STRIPE_SECRET_KEY;
  const price = process.env.STRIPE_PRICE_ID;
  const publicUrl = process.env.UMY_SITE_URL;
  if(!secret || !price || !publicUrl) return response.status(503).json({error:'Configuration de paiement incomplète'});
  if(!secret.startsWith('sk_test_')) return response.status(503).json({error:'Clé Stripe Sandbox requise pour les essais'});
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
  params.set('shipping_options[0][shipping_rate_data][display_name]','Livraison test (0 €)');
  params.set('shipping_address_collection[allowed_countries][0]','FR');
  params.set('billing_address_collection','required');
  params.set('phone_number_collection[enabled]','true');
  params.set('metadata[legging_size]',legging);
  params.set('metadata[bra_size]',brassiere);
  params.set('metadata[collection]','UMY BLACK - SET 01');
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
