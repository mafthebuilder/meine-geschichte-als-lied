# Mon Histoire Chantée — MVP

Starter complet pour une landing page + tunnel de chanson personnalisée, déployé sur Cloudflare Workers et connecté au checkout Shopify.

## Stack
- React + Vite
- Cloudflare Workers Static Assets
- D1 pour le contenu et les questionnaires
- R2 pour les médias remplaçables
- Shopify Storefront API pour créer le checkout

## Installation
```bash
npm install
npm run dev
```

## Déploiement Cloudflare
1. Connecter ce dépôt dans **Workers & Pages > Create > Import a repository**.
2. Build command : `npm run build`
3. Deploy command : `npx wrangler deploy`
4. Le premier déploiement peut provisionner automatiquement D1 et R2.

Ajouter ensuite les secrets :
```bash
npx wrangler secret put SHOPIFY_PRIVATE_STOREFRONT_TOKEN
npx wrangler secret put SHOPIFY_ESSENTIAL_VARIANT_ID
npx wrangler secret put SHOPIFY_PREMIUM_VARIANT_ID
npx wrangler secret put SHOPIFY_EXPRESS_VARIANT_ID
npx wrangler secret put ADMIN_TOKEN
```

Les identifiants de variantes doivent être au format `gid://shopify/ProductVariant/...`.

## Administration
- URL : `/admin`
- Le token saisi dans l’interface doit correspondre au secret `ADMIN_TOKEN`.
- Les textes, couleurs et médias enregistrés sont stockés dans D1/R2.

## Domaine
- Site : `monhistoirechantee.com`
- Checkout prévu : domaine Shopify ou `pay.monhistoirechantee.com`

- Deployment test

## Pages MVP
- `/` : landing page
- `/composer` : tunnel en 6 étapes
- `/admin` : édition des textes, couleurs et médias principaux

- trigger build2
