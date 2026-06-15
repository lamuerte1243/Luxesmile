# Luxesmile Dental Clinic — Static Website

**Nairobi, Kenya's premier dental clinic website** — built as a near 1:1 copy of the [Hident WordPress Theme](https://preview.themeforest.net/item/hident-dentist-dental-clinic-wordpress-theme/full_screen_preview/63491406) adapted with Luxesmile's Navy + Gold brand identity.

---

## 🎨 Design System

| Element | Value |
|---|---|
| **Primary Font** | Poppins (headings, nav, buttons) — matching Hident's geometric sans-serif |
| **Body Font** | DM Sans (body text, paragraphs) |
| **Gold Accent** | `#D4AF37` — replaces Hident's mint/teal accent |
| **Navy Base** | `#0F172A` — primary dark color |
| **Off-white BG** | `#F8FAFC` — section backgrounds |
| **CDN** | Google Fonts, Font Awesome 6.5, Cloudflare |

---

## 📄 Pages & Features

### `index.html` — Homepage
- ✅ Sticky top bar with contact info + social links
- ✅ Sticky navbar (Hident style: logo left · nav center · pill CTA right)
- ✅ Hero section (Hident split layout: text left, image right with floating stat cards)
- ✅ Feature strip (dark navy bar, 4 feature icons)
- ✅ Services grid (6 cards with hover animations)
- ✅ Stats counter section (animated on scroll)
- ✅ About section (split grid with image badge showing "12+ Years")
- ✅ **Before/After teeth whitening slider** (drag handle — Black/African person)
- ✅ Process steps (4-step with connector line)
- ✅ Why Choose Us (split with double image stack)
- ✅ Team section (4 specialists with social hover overlay)
- ✅ Testimonials (3 cards on dark navy background, Google rating)
- ✅ Appointment booking form (split layout)
- ✅ Blog preview (3 article cards)
- ✅ CTA band (dark navy with gold CTA)
- ✅ Full footer (4-column: brand, services, links, contact)
- ✅ Cart sidebar (slide-in)
- ✅ Back-to-top button
- ✅ Preloader with animated tooth SVG

### `services.html` — Services Page
- ✅ Page hero (dark navy, breadcrumb)
- ✅ Sticky service navigation bar (scrollable tabs)
- ✅ 7 alternating service sections (image/text split layout):
  - Dental Implants
  - Teeth Whitening
  - Orthodontics & Braces
  - Cosmetic Dentistry
  - General Dentistry
  - Pediatric Dentistry
  - Emergency Dentistry
- ✅ Pricing cards (3 tiers with featured card)
- ✅ FAQ accordion (5 common questions)
- ✅ CTA band

### `blog.html` — Blog Listing
- ✅ Featured article (large hero card)
- ✅ Category filter pills (All, Implants, Whitening, Kids, Cosmetic, General)
- ✅ Live search (client-side filtering)
- ✅ 9-article grid with category badges
- ✅ Newsletter signup form

### `blog_single.html` — Article Reader
- ✅ Dynamic article loader (JS-powered from data store)
- ✅ 3 fully written articles (1000+ words each):
  - Complete Guide to Dental Implants
  - Professional vs At-Home Whitening
  - Kids First Dental Visit
- ✅ Author card with avatar
- ✅ Share buttons (Facebook, Twitter, WhatsApp, Copy Link)
- ✅ Related articles section
- ✅ Sidebar (CTA widget, popular articles, contact info)

### `shop.html` — Dental Shop
- ✅ Trust bar (Dentist-Approved, Kenya Delivery, M-Pesa, Returns)
- ✅ Category filter pills + price sort
- ✅ 12 real dental products with Unsplash images
- ✅ Product cards with hover actions (wishlist, quick view)
- ✅ localStorage cart (add, remove, quantity)
- ✅ Cart sidebar with M-Pesa checkout simulation
- ✅ Wishlist with localStorage persistence

### `contact.html` — Contact & Booking
- ✅ Emergency banner (24/7 emergency line)
- ✅ 4 quick contact option cards (Call, WhatsApp, Email, Map)
- ✅ Full appointment booking form with success state animation
- ✅ Opening hours table
- ✅ Google Maps embed (Ruiru, Nairobi)
- ✅ General message form
- ✅ Emergency 24/7 dental line prominently displayed

### `careers.html` — Careers
- ✅ Hero with stats bar (team size, years, open roles, retention)
- ✅ Why Join Us section (split layout)
- ✅ 6 benefit cards (CPD, health cover, salary, flexible hours, tech, culture)
- ✅ 6 open job listings with apply buttons
- ✅ Team culture testimonials (4 quotes on dark background)
- ✅ Full application form (with role auto-fill from job listings)

---

## ⚙️ Technical Stack

- **HTML5** — Semantic markup throughout
- **CSS3** — Custom properties, Grid, Flexbox, animations
- **Vanilla JavaScript** — No framework dependencies
- **Google Fonts** — Poppins + DM Sans (exact Hident-style fonts)
- **Font Awesome 6.5** — Icons throughout

### JavaScript Features (`js/main.js`)
- Preloader (1.5s delay)
- Sticky navbar with scroll shadow
- Mobile menu (slide-in with overlay)
- IntersectionObserver scroll reveals
- Animated counters (requestAnimationFrame)
- **Before/After slider** (mouse + touch drag support)
- FAQ accordion
- Toast notification system
- localStorage cart (add/remove/qty)
- localStorage wishlist
- Blog search + category filter
- Shop filters + price sort
- Appointment/contact/careers form submissions
- Back-to-top button
- Active nav link detection

### CSS Architecture (`css/style.css`)
- Full CSS custom properties system
- Poppins + DM Sans fonts
- Hident-style component system (cards, buttons, forms)
- Floating card animations (hero cards)
- Before/After slider CSS (clip-path)
- Responsive breakpoints (1200px, 1024px, 768px, 480px)
- Scroll reveal classes (.reveal, .reveal-left, .reveal-right, .reveal-scale)

---

## 🌍 Brand & Content

| Item | Detail |
|---|---|
| **Business Name** | Luxesmile Dental Clinic |
| **Location** | Ruiru Town &amp; Ruai, Nairobi, Kenya |
| **Phone** | +254 700 123 456 |
| **Emergency** | +254 722 999 888 (24/7) |
| **Email** | info@luxesmile.co.ke |
| **Hours** | Mon–Fri: 8am–7pm · Sat: 8am–4pm |
| **Founded** | 2012 |
| **Patients** | 12,500+ |
| **Team** | 8 specialist dentists |

### Team
- Dr. Amara Osei — Lead Dentist & Implantologist
- Dr. Fatima Kamau — Orthodontist & Invisalign Expert
- Dr. Kofi Mensah — Cosmetic Dentist & Veneer Specialist
- Dr. Nia Wanjiku — Pediatric Dentist & Oral Surgeon

---

## 🚀 Deployment

To publish this website live, go to the **Publish tab** in the editor. No build step required — this is a purely static HTML/CSS/JS site.

---

## 📌 Key Design Decisions (vs Hident Reference)

| Hident | Luxesmile Adaptation |
|---|---|
| Teal/mint accent (#5CD6B6) | Gold accent (#D4AF37) |
| Generic dental stock photos | Black/African people throughout |
| White patient in before/after | Black/African patient in slider |
| Poppins + DM Sans fonts | ✅ Same fonts used |
| Geometric sans-serif headings | ✅ Poppins 800 weight used |
| Floating stat cards on hero | ✅ Implemented |
| Dark navy sections | ✅ Navy #0F172A used |
| Split hero layout | ✅ Implemented |
| Animated scroll reveals | ✅ Implemented |
| Before/after drag slider | ✅ Implemented |
| Sticky service nav | ✅ Implemented |
| Cart sidebar | ✅ Implemented |
