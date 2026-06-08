# Deployment na Vercel

## Preduvjeti

- GitHub račun sa pristupom repozitoriju
- Vercel račun (https://vercel.com)
- ThingsBoard server dostupan putem mreže

## Konfiguracija prije deployment-a

### 1. Lokalne environment varijable

Kreiraj `.env.local` sa slijedećim:

```
NEXT_PUBLIC_USE_MOCK=false
THINGSBOARD_URL=http://161.53.133.253:8080
```

Test lokalno:
```bash
npm install
npm run dev
```

Otvori http://localhost:3000 i provjeri da li radi.

### 2. Vercel Setup

#### Opcija A: GitHub Integration (preporučeno)

1. Idi na https://vercel.com/new
2. "Import Git Repository" → odaberi `lwlup/iot_opg_web`
3. Vercel će automatski detektovati Next.js

#### Opcija B: Vercel CLI

```bash
npm i -g vercel
vercel
```

### 3. Environment Varijable na Vercel

U Vercel project settings → Environment Variables, dodaj:

```
NEXT_PUBLIC_USE_MOCK=false
THINGSBOARD_URL=http://161.53.133.253:8080
```

⚠️ **VAŽNO**: `NEXT_PUBLIC_` prefiks znači da je varijabla dostupna u browser-u. Samo URL trebala biti public.

### 4. Build Settings

Vercel automatski koristi:
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Install Command**: `npm ci`

Nema potrebe za mijenjanjem.

## Deployment

### Push na GitHub

```bash
git add .
git commit -m "Deploy ready for Vercel"
git push origin main
```

Vercel će automatski detektovati push i pokrenuti build/deploy.

### Provjera deployment-a

1. Idi na https://your-project.vercel.app
2. Testiraj login sa ThingsBoard kredencijalom
3. Provjeri da li se podaci učitavaju sa ThingsBoard-a
4. Testiraj dodavanje/editiranje plastenika i uređaja

## Troubleshooting

### Build neuspješan

```bash
npm run build
# Vidi output za greške
```

### ThingsBoard veza ne radi

- Provjeri je li `THINGSBOARD_URL` dostupan javno
- Ako koristiš HTTP umjesto HTTPS, Vercel možda trebala CORS konfiguracija
- Test sa Postman-om: `curl http://161.53.133.253:8080/api/auth/login`

### Cookie/Auth problemi

- ThingsBoard auth token se sprema u `tb_token` cookie
- Provjeri je li cookie pravilno postavljen u Network tab

## Production Checklist

- [ ] `.env.local` ne commitaj (dodano u `.gitignore`)
- [ ] Environment varijable postavljene na Vercel
- [ ] Build uspješan bez warningsa
- [ ] Live auth radi (login sa TB kredencijalima)
- [ ] Podaci se učitavaju sa TB-a
- [ ] Dodavanje/brisanje plastenika radi

## Custom Domain

Kada je sve OK:

1. U Vercel → Settings → Domains
2. Dodaj custom domenu
3. Konfiguruj DNS prema Vercel upurama

---

**Kontakt**: Ako probleme, provjeri Vercel logs u Deployments tab.
