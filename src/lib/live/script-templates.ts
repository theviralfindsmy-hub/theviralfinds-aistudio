// ─── Shopee Live Script Templates (Malaysian context) ────────────────────────
// 6 templates: opening, demo, Q&A, flash sale, closing, + full multi-product script
// Mix of Manglish + Bahasa Malaysia — the way Malaysian live hosts actually speak.
// Placeholders use {snake_case} tokens for easy replacement.

import type { ScriptTemplate } from './types'

export const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  // ─── 1. Opening ─────────────────────────────────────────────────────────
  {
    id: 'opening',
    name: 'Opening Hook',
    description: 'Sambutan + hook untuk tarik perhatian dalam 2 minit pertama',
    durationMin: 2,
    category: 'opening',
    placeholders: [
      'session_title',
      'host_name',
      'product_category',
      'product_name',
      'discount_label',
    ],
    body: `[OPENING — 2 min]
"Wassup everyone! Welcome to {session_title}! 🔥 Saya {host_name}, your host for tonight.

Quick question — siapa sini tengah cari {product_category} murah tapi berkualiti? Comment 'YES' kalau ya!
Sebab hari ni saya ada bawak {product_name} dengan {discount_label} khas untuk korang semua.

Before kita mula, jangan lupa tap that follow button 🔔 so korang tak miss live seterusnya.
Ok, ready? Let's go!"`,
  },

  // ─── 2. Product Demo ─────────────────────────────────────────────────────
  {
    id: 'demo',
    name: 'Product Demo',
    description: 'Tunjuk produk dekat-dekat, highlight features + benefits',
    durationMin: 5,
    category: 'demo',
    placeholders: [
      'product_name',
      'original_price',
      'live_price',
      'product_features_with_demo_steps',
    ],
    body: `[DEMO — 5 min]
"Ok jom kita tengok {product_name} ni dekat-dekat. Harga biasa RM{original_price}, tapi hari ni je korang boleh dapat pada RM{live_price}!

{product_features_with_demo_steps}

Cuba tengok texture dia... cantik kan? Quality dia confirm tak mengecewakan.
Tengok jugak packaging dia — secure, takkan rosak masa shipping.

For those yang tanya 'berat tak?', dia cuma ringan je, senang nak bawa travel.
Kalau korang suka, teruskan scroll bawah live ni dan klik 'Beli Sekarang'. Stock semakin berkurang!"`,
  },

  // ─── 3. Q&A ──────────────────────────────────────────────────────────────
  {
    id: 'qa',
    name: 'Q&A Segment',
    description: 'Jawab soalan-soalan common dari viewers',
    durationMin: 3,
    category: 'qa',
    placeholders: ['question_1', 'answer_1', 'question_2', 'answer_2'],
    body: `[Q&A — 3 min]
"Saya nampak ada yang tanya soalan. Mari kita jawab satu-satu.

{question_1} — Ya betul, {answer_1}.

{question_2} — {answer_2}.

Kalau ada lagi soalan, type kat comment sekarang sebelum kita masuk flash sale!
Jangan malu tau, saya baca semua comment satu-satu.

Ada yang tanya pasal shipping — yes, free shipping untuk seluruh Malaysia, Sabah Sarawak pun termasuk!"`,
  },

  // ─── 4. Flash Sale ───────────────────────────────────────────────────────
  {
    id: 'flash_sale',
    name: 'Flash Sale CTA',
    description: 'Urgency + scarcity untuk push conversions',
    durationMin: 2,
    category: 'flash_sale',
    placeholders: [
      'duration',
      'product_name',
      'first_n_buyers',
      'flash_price',
    ],
    body: `[FLASH SALE — 2 min]
"OK GUYS! FLASH SALE MULA SEKARANG! ⚡⚡⚡

Hanya {duration} minit je! {product_name} untuk {first_n_buyers} pembeli pertama pada RM{flash_price}!

Stock terhad! Jangan ragu-ragu, klik link kat bawah live sekarang!

3... 2... 1... GO! 🚀

Yang dah add to cart, cepat checkout sebelum habis slot!
Yang masih ragu-ragu — ini peluang terakhir, lepas ni harga naik balik."

[Timer mula di skrin — 02:00]`,
  },

  // ─── 5. Closing ──────────────────────────────────────────────────────────
  {
    id: 'closing',
    name: 'Closing & Teaser',
    description: 'Terima kasih + teaser untuk session seterusnya',
    durationMin: 1,
    category: 'closing',
    placeholders: ['next_session_teaser'],
    body: `[CLOSING — 1 min]
"Terima kasih korang semua yang join malam ni! 🙏
Sesi seterusnya akan datang {next_session_teaser}.

Follow saya untuk notification live seterusnya — banyak lagi barang murah + diskauun raya akan saya bawak!

Sampai jumpa! Wassalam. ✌️"`,
  },

  // ─── 6. Full Multi-Product Session ──────────────────────────────────────
  {
    id: 'full_session',
    name: 'Full Session Script',
    description: 'Complete script dengan opening, demo setiap produk, Q&A, flash sale + closing',
    durationMin: 30,
    category: 'full',
    placeholders: [
      'session_title',
      'host_name',
      'product_category',
      'discount_label',
      'product_name',
      'original_price',
      'live_price',
      'product_features_with_demo_steps',
      'question_1',
      'answer_1',
      'question_2',
      'answer_2',
      'duration',
      'first_n_buyers',
      'flash_price',
      'next_session_teaser',
    ],
    body: `[OPENING — 2 min]
"Wassup everyone! Welcome to {session_title}! 🔥 Saya {host_name}, your host for tonight.

Quick question — siapa sini tengah cari {product_category} murah tapi berkualiti? Comment 'YES' kalau ya!
Sebab hari ni saya ada bawak {product_name} dengan {discount_label} khas untuk korang semua."

[DEMO — 5 min]
"Ok jom kita tengok {product_name} ni dekat-dekat. Harga biasa RM{original_price}, tapi hari ni je korang boleh dapat pada RM{live_price}!
{product_features_with_demo_steps}
Cuba tengok texture dia... cantik kan? Quality dia confirm tak mengecewakan."

[Q&A — 3 min]
"Saya nampak ada yang tanya soalan.
{question_1} — Ya, {answer_1}.
{question_2} — {answer_2}.
Kalau ada lagi soalan, type kat comment sekarang sebelum kita masuk flash sale!"

[FLASH SALE — 2 min]
"OK GUYS! FLASH SALE MULA SEKARANG! ⚡⚡⚡
Hanya {duration} minit je! {product_name} untuk {first_n_buyers} pembeli pertama pada RM{flash_price}!
Stock terhad! Jangan ragu-ragu, klik link kat bawah live sekarang!
3... 2... 1... GO!"

[CLOSING — 1 min]
"Terima kasih korang semua yang join malam ni! 🙏 Sesi seterusnya akan datang {next_session_teaser}.
Follow saya untuk notification live seterusnya. Sampai jumpa!"`,
  },
]

// Helper to look up a template by id
export function getTemplateById(id: string): ScriptTemplate | undefined {
  return SCRIPT_TEMPLATES.find((t) => t.id === id)
}

// Default placeholder values used when product/session data is missing
export const DEFAULT_PLACEHOLDER_VALUES: Record<string, string> = {
  session_title: 'Shopee Live Session',
  host_name: 'Kak Amy',
  product_category: 'produk menarik',
  product_name: 'produk ni',
  discount_label: 'DISKAUN RAYA',
  original_price: '99',
  live_price: '59',
  flash_price: '39',
  product_features_with_demo_steps:
    '1) Buka packaging — cantik, kemas. 2) Tunjuk bahan/material — premium quality. 3) Demo guna — senang, hasil confirm lawa.',
  question_1: 'Ini ori ke?',
  answer_1: '100% original, ada warranty dari seller',
  question_2: 'Berapa lama shipping?',
  answer_2: '1-3 hari working days, free shipping seluruh Malaysia',
  duration: '5',
  first_n_buyers: '50',
  next_session_teaser: 'Jumaat depan, 9PM — Raya Beauty Haul Part 2',
}

// Replace {placeholders} in a template body with provided values
export function fillTemplate(
  body: string,
  values: Record<string, string | number | undefined>
): string {
  const merged: Record<string, string> = { ...DEFAULT_PLACEHOLDER_VALUES }
  for (const [k, v] of Object.entries(values)) {
    if (v !== undefined && v !== null) merged[k] = String(v)
  }
  return body.replace(/\{(\w+)\}/g, (_, key: string) => merged[key] ?? `{${key}}`)
}
