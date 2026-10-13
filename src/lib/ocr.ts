// ============================================================
// SIDU — OCR via Gemini AI (MVP) + hook Python OCR (masa depan)
// ------------------------------------------------------------
// Output terstruktur konsisten:
// { ok: boolean, rawText: string|null, source: "gemini"|"python-ocr", error?: string }
//
// Field rawText berisi JSON string dengan minimal:
// { nominal: number|null, tanggal: string|null, namaBank: string|null,
//   rawOcrText: string }
//
// Struktur ini dibuat agnostik sumber OCR — kalau nanti Python
// OCR ditambahkan, downstream logic (simpan ke Struk.ocrRawText,
// admin verifikasi) TIDAK perlu diubah.
// ============================================================

import ZAI from "z-ai-web-dev-sdk";

export type OcrResult = {
  ok: boolean;
  rawText: string | null;
  source: "gemini" | "python-ocr";
  error?: string;
};

const SYSTEM_PROMPT = `Anda adalah sistem OCR untuk struk pembayaran Indonesia.
Tugas: ekstrak informasi dari gambar struk transfer bank/e-wallet/QRIS.

Kembalikan HANYA JSON valid dengan skema:
{
  "nominal": number | null,        // nominal transfer dalam Rupiah (angka, tanpa "Rp" atau titik). null jika tidak terbaca.
  "tanggal": string | null,        // tanggal transaksi format YYYY-MM-DD. null jika tidak terbaca.
  "namaBank": string | null,       // nama bank/e-wallet (mis "BCA", "GoPay"). null jika tidak terbaca.
  "rawOcrText": string              // teks mentah hasil OCR, gabungan seluruh teks yang terbaca
}

Aturan:
- Jika gambar BUKAN struk pembayaran, return semua field null kecuali rawOcrText.
- Jangan tambahkan teks di luar JSON.
- Jangan bungkus dengan markdown code fence.`;

/**
 * Jalankan OCR via Gemini (z-ai-web-dev-sdk chat dengan image).
 * Fallback ke python-ocr hook jika GEMINI_API_KEY kosong & OCR_SERVICE_URL diset (masa depan).
 */
export async function runOcr(
  imageBuffer: Buffer,
  mimeType: string
): Promise<OcrResult> {
  // Hook masa depan: jika OCR_SERVICE_URL diset, panggil python OCR service
  const ocrServiceUrl = process.env.OCR_SERVICE_URL;
  if (ocrServiceUrl) {
    try {
      const r = await fetch(ocrServiceUrl, {
        method: "POST",
        headers: { "Content-Type": mimeType },
        body: imageBuffer,
      });
      if (r.ok) {
        const data = (await r.json()) as { rawText?: string; ok?: boolean };
        return {
          ok: Boolean(data.ok),
          rawText: data.rawText ?? null,
          source: "python-ocr",
          error: data.ok ? undefined : "Python OCR returned not-ok",
        };
      }
    } catch (e) {
      console.warn("[ocr] python-ocr fallback gagal, lanjut ke Gemini:", e);
    }
  }

  // Gemini via z-ai-web-dev-sdk
  try {
    const zai = await ZAI.create();
    const base64 = imageBuffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const completion = await zai.chat.completions.createVision({
      model: "glm-4.5v", // vision model
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${SYSTEM_PROMPT}\n\nEkstrak informasi struk ini. Kembalikan JSON saja.`,
            },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      temperature: 0.1,
    });

    const content = completion.choices?.[0]?.message?.content ?? "";
    // Bersihkan dari code fence jika ada
    const cleaned = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    // Validasi parse JSON
    try {
      JSON.parse(cleaned);
    } catch {
      return {
        ok: false,
        rawText: null,
        source: "gemini",
        error: "Output Gemini bukan JSON valid.",
      };
    }

    return { ok: true, rawText: cleaned, source: "gemini" };
  } catch (e) {
    console.error("[ocr] gemini error", e);
    return {
      ok: false,
      rawText: null,
      source: "gemini",
      error: e instanceof Error ? e.message : "Gagal memanggil Gemini.",
    };
  }
}

/**
 * Parse ocrRawText (JSON string) ke objek terstruktur.
 * Return null jika gagal parse.
 */
export function parseOcrResult(rawText: string | null): {
  nominal: number | null;
  tanggal: string | null;
  namaBank: string | null;
  rawOcrText: string;
} | null {
  if (!rawText) return null;
  try {
    const obj = JSON.parse(rawText);
    return {
      nominal: typeof obj.nominal === "number" ? obj.nominal : null,
      tanggal: typeof obj.tanggal === "string" ? obj.tanggal : null,
      namaBank: typeof obj.namaBank === "string" ? obj.namaBank : null,
      rawOcrText: typeof obj.rawOcrText === "string" ? obj.rawOcrText : "",
    };
  } catch {
    return null;
  }
}
