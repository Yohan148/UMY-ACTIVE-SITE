# UMY ACTIVE — activation des préventes (non activées)

Le site reste **en mode préparation**, aucun paiement actif.

## 1. À valider avant encaissement
- Prix final TTC du SET 01, frais de livraison TTC et traitement de la TVA.
- Tailles réellement fabriquées (les valeurs XS–XL sont provisoires).
- Calendrier de fabrication, livraison annoncée et conditions de vente / rétractation.
- Quantité disponible : le site indique 200 ensembles prévus, **aucune limitation automatisée à 200 commandes** n'existe encore.
- Les textes FAQ promettant un prix « à vie » / des avantages spécifiques doivent être revus si ces avantages ne sont pas validés.
- En production, utiliser la photographie fidèle au prototype.

## 2. Stripe
Dans Stripe, créer un produit SET 01 UMY Black avec un prix **unique** en EUR comprenant le legging et la brassière, et un tarif de livraison France. Vérifier fiscalité et coordonnées de l'entreprise dans Stripe.

## 3. Variables d'environnement Vercel (côté serveur, jamais dans index.html)
- STRIPE_SECRET_KEY = votre clé Stripe secrète (test pour essais)
- STRIPE_PRICE_ID = identifiant price_... de l'ensemble
- STRIPE_SHIPPING_RATE_ID = identifiant shr_... de la livraison
- UMY_SITE_URL = URL HTTPS officielle de la boutique
- UMY_PREORDERS_ENABLED = true, uniquement à l'ouverture confirmée

La fonction `api/checkout.js` valide les tailles et n'accepte les commandes que si toutes ces variables existent. Elle crée une session Stripe Checkout qui contient les tailles dans les métadonnées.

## 4. Frontend
Le formulaire est dans `index.html`. Le booléen `PREORDERS_OPEN` est **false** jusqu'à validation manuelle. Pour l'activer, passer à `true` et déployer avec les variables serveur configurées.

## 5. Tests indispensables
- Sur ordinateur et sur mobile : choisir séparément les tailles XS–XL et vérifier le récapitulatif.
- Vérifier que le bouton reste désactivé sans taille, et avant ouverture.
- En mode Stripe **test** : réaliser une commande, vérifier les deux tailles dans les métadonnées de la session/paiement.
- Vérifier frais de livraison France, prix TTC, adresse, succès, annulation, remboursement et notification client.
- Vérifier l'événement `checkout.session.completed` pour la gestion des commandes (webhook à développer selon outil de suivi choisi).
- Vérifier la livraison promise, les politiques de retour et les mentions légales.

**Attention :** une redirection navigateur vers `?checkout=return` n'est pas une preuve de paiement confirmé. Ne pas afficher « commande validée » sans vérification côté serveur.
