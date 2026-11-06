import { NextResponse } from 'next/server'

interface ContentTemplate {
  id: string
  name: string
  description: string
  category: string
  type: string
  platform: string
  icon: string
  template: string
  language: string
  tone: string
}

const TEMPLATES: ContentTemplate[] = [
  {
    id: 'tiktok-before-after',
    name: 'TikTok Before/After',
    description: 'Show the transformation! Perfect for skincare, makeup, home makeover, and fitness products.',
    category: 'TikTok',
    type: 'script',
    platform: 'tiktok',
    icon: '✨',
    language: 'manglish',
    tone: 'excited',
    template: `[Hook - First 3 seconds]
"Wait... you guys NEED to see this 😱"

[Before Shot]
Show the "before" state clearly - skin condition, messy room, etc.
"Ni before lah... memang tragic 😅"

[Transition]
Snap fingers or cover camera

[After Shot]
Reveal the "after" - clear skin, organized room, etc.
"After guna [PRODUCT]... walao eh! Best giler! 🤩"

[Demo/Evidence]
Quick demo of the product in action
"Ni cara pakai dia, senang je confirm 👍"

[CTA]
"Link dekat bio! Grab sebelum habis stock 🔥"
#ad #promosi #[PRODUCT] #[NICHE]
`,
  },
  {
    id: 'tiktok-unboxing',
    name: 'TikTok Unboxing',
    description: 'First impressions matter! Unbox with excitement and show authentic reactions.',
    category: 'TikTok',
    type: 'script',
    platform: 'tiktok',
    icon: '📦',
    language: 'manglish',
    tone: 'excited',
    template: `[Hook]
"Shopee haul sampai! Ni yang paling excited nak unbox 📦✨"

[Opening Package]
Show the package, tear it open with genuine excitement
"Wah packaging dia chun gila! Ni branded packaging tau 😍"

[First Look]
Hold up the product, show from different angles
"First impression... confirm quality ni. Berat dia memang solid 👌"

[Close-up Details]
Zoom into details, texture, packaging details
"Tengok details dia... memang premium feel. Tak tipu!" 

[Initial Reaction/Test]
Quick first use or test
"Dah try sikit... shiok weh! Nanti full review kat next video 🔥"

[CTA]
"Link dekat bio, harga memang worth it! #RacunShopee 💜"
#ad #promosi #[PRODUCT]
`,
  },
  {
    id: 'tiktok-product-demo',
    name: 'TikTok Product Demo',
    description: 'Show don\'t tell! Demonstrate the product features in action.',
    category: 'TikTok',
    type: 'script',
    platform: 'tiktok',
    icon: '🎯',
    language: 'manglish',
    tone: 'casual',
    template: `[Hook]
"Korang tengok ni... [PRODUCT] memang terer buat benda ni 🎯"

[Problem Setup]
"Selalu kan, masalah [PROBLEM] ni memang annoying kan?"
"Macam saya, [RELATABLE PROBLEM]"

[Product Introduction]
"Ni lah [PRODUCT]! Dia boleh [KEY FEATURE] senang-senang je"

[Demo Step 1]
Show the first feature
"Tengok, senang je nak [ACTION]. Click je, dah siap 👆"

[Demo Step 2]
Show another feature
"Yang best lagi, dia ada [FEATURE 2]. Confirm berguna!"

[Demo Step 3]
Show final result
"Dah siap! Bandingkan before and after... kaw tim! 🤩"

[CTA]
"Grab kat link bio, harga under RM[XX] je! 🔥"
#ad #promosi #[PRODUCT]
`,
  },
  {
    id: 'ig-reels-tryon',
    name: 'Instagram Reels Try-On',
    description: 'Perfect for fashion, accessories, and beauty. Show yourself wearing/using the product.',
    category: 'Instagram',
    type: 'script',
    platform: 'instagram',
    icon: '👗',
    language: 'manglish',
    tone: 'casual',
    template: `[Hook - Transition Reel]
Point to text overlay: "OOTD dari Shopee je, tapi orang ingat designer 👀"

[Look 1 - Casual]
Transition snap - show first outfit
"Ni daily look, simple tapi chun! [PRODUCT DETAILS]"

[Look 2 - Dressy]  
Another transition - show second outfit
"Yang ni pulak kalau nak pergi event, confirm banyak orang tanya mana beli 😏"

[Details/Close-ups]
Show fabric quality, fit, details
"Quality dia... for that price? Memang steal lah 🔥"

[Styling Tips]
Quick tip on how to style
"Pro tip: pair dengan [ACCESSORY] untuk look lagi kaw ✨"

[CTA - Text Overlay]
"Link in bio! Size S-XXL ada 🔗"
#ad #promosi #RacunShopee
`,
  },
  {
    id: 'shopee-live-script',
    name: 'Shopee Live Script',
    description: 'Complete live selling script with greeting, product pitch, price reveal, and CTA.',
    category: 'Shopee Live',
    type: 'live_script',
    platform: 'shopee_live',
    icon: '🛍️',
    language: 'manglish',
    tone: 'excited',
    template: `[OPENING - 0:00-0:30]
"Hai semua! Welcome welcome! Siapa yang join sekarang, comment 'SALE' untuk chance menang voucher! 🎉"

[PRODUCT INTRO - 0:30-1:00]
"Okay hari ni saya nak tunjuk satu barang yang VIRAL gila kat Shopee... [PRODUCT NAME]! Korang tengok packaging dia..."

[FEATURES - 1:00-2:00]
"Ni yang best pasal [PRODUCT]:
✅ [BENEFIT 1] - memang game changer
✅ [BENEFIT 2] - confirm korang suka
✅ [BENEFIT 3] - bukan main senang nak guna
✅ [BENEFIT 4] - quality premium tapi harga... tunggu dulu 😏"

[DEMO - 2:00-3:00]
Live demo of the product
"Tengok ni... [DEMONSTRATE]. See? Senang je! Saya try depan korang ni, real one tau!"

[PRICE REVEAL - 3:00-3:30]
"Kalau kat luar, benda ni boleh sampai RM[XX]. Tapi HARI NI..."
Build anticipation
"RM[YY] JE!!! 😱😱😱"

[URGENCY - 3:30-4:00]
"Tapi stock limited je tau! Tinggal [X] unit je lagi. Yang grab sekarang, free shipping pulak!"
"Add to cart SEKARANG sebelum habis! ⏰"

[Q&A - 4:00-5:00]
"Ada soalan? Comment kat bawah! 
- Yes, ori tau!
- Ada warranty [X] bulan
- Delivery [X-X] hari je"

[CLOSING CTA]
"Okay last call! [PRODUCT] at RM[YY] je, click add to cart sekarang! 🛒💨"
#ad #promosi #ShopeeLive #[PRODUCT]
`,
  },
  {
    id: 'fb-product-comparison',
    name: 'Facebook Product Comparison',
    description: 'Compare products to help followers make the best choice. Builds trust and authority.',
    category: 'Facebook',
    type: 'comparison',
    platform: 'facebook',
    icon: '⚖️',
    language: 'manglish',
    tone: 'professional',
    template: `[HOOK]
"Choosing between [PRODUCT A] and [PRODUCT B]? Let me break it down for you 👇"

[INTRO]
"Both products are popular on Shopee, but which one is actually worth your money? I've tested both, so here's my honest comparison."

[PRODUCT A OVERVIEW]
"📌 [PRODUCT A] - RM[XX]
✅ [PRO 1]
✅ [PRO 2]
❌ [CON 1]
Best for: [USE CASE]"

[PRODUCT B OVERVIEW]
"📌 [PRODUCT B] - RM[YY]
✅ [PRO 1]
✅ [PRO 2]
❌ [CON 1]
Best for: [USE CASE]"

[VERDICT]
"🏆 My Pick: [WINNER]
If you want [CRITERIA] → go for [PRODUCT A]
If you want [CRITERIA] → go for [PRODUCT B]"

[CTA]
"Both links are in the comments below! Which one would you choose? Comment A or B! 👇"
#ad #promosi #[NICHE]
`,
  },
  {
    id: 'price-reveal',
    name: 'Price Reveal',
    description: 'Build suspense then reveal an amazing price. Great for flash sales and deals.',
    category: 'TikTok',
    type: 'caption',
    platform: 'tiktok',
    icon: '💰',
    language: 'manglish',
    tone: 'excited',
    template: `😱 You guys are NOT ready for this price...

[PRODUCT] yang orang selalu cari, yang viral kat Shopee tu...

Bukan RM[XX]...
Bukan RM[YY]...
Bukan RM[ZZ]...

TAPI RM[FINAL] JE!!! 💰🔥

GILA right?! Quality dia premium, tapi harga macam wholesale. Confirm kena grab before habis!

✅ [BENEFIT 1]
✅ [BENEFIT 2]  
✅ [BENEFIT 3]

Link dekat bio! Jangan ketinggalan 🏃‍♂️💨

#ad #promosi #RacunShopee #Budol #[PRODUCT] #[NICHE]`,
  },
  {
    id: 'problem-solution',
    name: 'Problem-Solution',
    description: 'Start with a relatable problem, then introduce your product as the solution. High conversion format.',
    category: 'Instagram',
    type: 'caption',
    platform: 'instagram',
    icon: '💡',
    language: 'manglish',
    tone: 'casual',
    template: `Real talk... 👀

Selalu ada masalah [PROBLEM] kan? Macam saya, [RELATABLE SITUATION]. Confirm ramai yang face benda ni tau.

Dah try macam-mcara nak solve:
❌ [FAILED SOLUTION 1]
❌ [FAILED SOLUTION 2]  
❌ [FAILED SOLUTION 3]

Until I found [PRODUCT] 💡

Ni bukan magic, tapi [HOW IT WORKS] memang buat perbezaan besar. Since guna [PRODUCT]:
✅ [RESULT 1]
✅ [RESULT 2]
✅ [RESULT 3]

The best part? Harga dia memang reasonable for the quality yang korang dapat. Tak tipu!

Swipe up / Link in bio untuk grab yours 🔗

#ad #promosi #[PRODUCT] #[NICHE] #SkincareMalaysia`,
  },
]

export async function GET() {
  return NextResponse.json({
    templates: TEMPLATES,
    categories: [...new Set(TEMPLATES.map(t => t.category))],
  })
}
