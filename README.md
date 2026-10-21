# Sandy's Kiddie Korral — Vercel-ready website

An original, colourful childcare website inspired by the layout approach of the Daycare Webflow template (not a copy of its template code or artwork). The theme reflects the supplied Sandy's Kiddie Korral logo: pink, blue, green and yellow.

## Contents

- Home page (`site/index.html`)
- About (`site/about/index.html`)
- Programs (`site/programs/index.html`)
- Parent information and FAQs (`site/families/index.html`)
- Contact / inquiry form (`site/contact/index.html`)
- Privacy notice (`site/privacy/index.html`)
- Responsive mobile navigation, scroll animations, interactive age filters
- Original vector illustrations, and the supplied logo used with permission from the user
- Vercel serverless contact API (`api/contact.js`)
- Zero-dependency Node.js dev server, which prints your actual LAN IP
- Build script and test suite

## Run locally (Windows PowerShell / VS Code)

```powershell
cd "D:\External Projects\sandys-kiddie-korral"
npm run dev
```

Open the **Local** or **Network** address printed in the terminal. The server listens on `0.0.0.0`, making it available on your LAN if your firewall allows it. No Wrangler or dependency installation is necessary. Node.js 18+ required.

To use another port:

```powershell
$env:PORT=8080
npm run dev
```

## Build

```powershell
npm run build
npm run preview
```

The production files are created in `dist/`.

## Deploy to Vercel

1. Upload **the entire project folder**, including `api/`, `scripts/`, `site/`, `package.json` and `vercel.json`, to GitHub.
2. Go to Vercel and **Add New Project**, import the repository.
3. Framework preset: **Other**.
4. Root Directory: repository root (folder containing `package.json`).
5. Build command: `npm run build`.
6. Output directory: `dist`.
7. Configure the email environment variable (see below), then deploy. Redeploy after any environment variable changes.
8. Vercel must have Node.js >= 18 selected. Functions are automatically discovered from `api/contact.js`.

## Connect the contact form to an inbox

Create a form at https://web3forms.com and verify the destination email for the childcare center. In Vercel > Project Settings > Environment Variables, add:

```
WEB3FORMS_ACCESS_KEY=YOUR_REAL_WEB3FORMS_KEY
```

For local testing, copy `.env.example` to `.env.local` and set the key there. `api/contact.js` submits the family details to Web3Forms from the server, rather than embedding the access key in the browser. If the key is not configured, the website still works, but the inquiry form displays a clear message directing the parent to call or email. No unconfigured message is silently discarded.

Test with a real enquiry after deployment. Successful simulated requests are not proof of email delivery. The childcare center should verify who receives notifications and review spam protection / privacy compliance before launch.

## Edit design and wording

- Main colors, fonts, responsiveness: `site/assets/styles.css` (`:root` variables)
- Home content: `site/index.html`
- Separate pages: `site/about`, `site/programs`, `site/families`, `site/contact`
- Interactivity: `site/assets/app.js`
- Contact API: `api/contact.js`
- Supplied logo: `site/assets/sandys-original-logo.png`; cropped brand logo and transparent symbol provided as variants
- Original SVG illustrations: `site/assets/hero-play.svg`, `site/assets/playbook.svg`, `site/assets/school-bus.svg`

## Verified vs unverified details

**Verified from the supplied logo and Oklahoma Human Services listing:**

- Name: Sandy's Kiddie Korral
- Address: 306 S Meno Ave, Meno, OK 73760
- Phone: (580) 776-2221
- Oklahoma child care center listing `K830058326`
- State listing: 3 Star Level Program, accepts subsidy, year-round daytime hours
- Mon-Fri 5:30 AM to 6:00 PM; weekends closed
- Age groups: infant 0-11 months; toddler 12-23 months; preschool 2-4 years; school-age 5+
- Director named Sandra Weathers and published contact email `weathers79@gmail.com`
- "Childcare / Preschool / Transportation" appears on the supplied logo

**Not independently verified:** current openings, rates and fees, age eligibility for transportation, transportation routes, school pickup/drop-off schedules, actual facilities, staffing, specific classroom activities and curricula, enrollment timeline, confirmed tours, customer reviews, social media links, and current owner-approved mission statements. The site deliberately avoids inventing any of these.

**Owner review before launch:** confirm hours, contact email recipient, fees, transport availability, programs/curriculum wording, image permissions, business privacy notice, and enrollment procedures. The logo artwork was uploaded by the requester. All other artwork is original SVG (not template assets). We intentionally use no photos of a real childcare facility to avoid misrepresentation. You can replace illustrations with approved center photos later.

## Sources

- Oklahoma state listing: https://ccl.dhs.ok.gov/providers/K830058326
- User-supplied listing URL: https://childcarefind.okdhs.org/providers/K830058326
- Visual design reference (do not copy assets): https://daycare-ttm.webflow.io/
- Web3Forms service and privacy: https://web3forms.com/ and https://web3forms.com/privacy

## SEO after choosing a custom domain

A custom domain has not been supplied, so this project deliberately does not invent one. Once the owner chooses a domain, set canonical URLs in each HTML page and generate `site/sitemap.xml` for the live domain. Verify Google Search Console and add authentic social links as available. If publishing the website in a Vercel preview before owner approval, review content and settings before public indexing.

## Accessibility & quality

- Keyboard-operable navigation, filter tabs, FAQs and form
- Responsive layout for phone / tablet / desktop
- Reduced motion support for visitors requesting reduced motion
- Focus-visible outlines and correct form validation feedback
- Descriptive image text; no copied template photography
- Local server blocks directory traversal and sets no-store cache for development

No commercial Webflow template license is required: this is an original design using the reference only for high-level layout inspiration.
