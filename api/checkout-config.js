// Public checkout state. Never expose credentials.
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Méthode non autorisée'});
 const live=process.env.UMY_LIVE_CHECKOUT_ENABLED==='true'
  && process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')
  && process.env.STRIPE_LIVE_PRICE_ID==='price_1USXCEDPF7nqy2IhMkj36fDC'
  && process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_')
  && process.env.UMY_LIVE_SHIPPING_CENTS==='0'
  && !!process.env.UMY_LIVE_SHIPPING_DESCRIPTION
  && !!process.env.UMY_LIVE_DELIVERY_ESTIMATE;
 res.status(200).json({live,price:109,delivery:'15 à 21 jours',shipping:'offerte en France'});
}
