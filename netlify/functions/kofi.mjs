// Ko-fi webhook and the live Support total.
// Ko-fi calls POST /api/kofi only for completed payments, so failed or abandoned payments never count.
// GET /api/support returns {raised, goal, supporters} for the Support page.
import { getStore } from "@netlify/blobs";

const json = { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store", "Content-Type": "application/json" };

export default async (req) => {
  const store = getStore("support");
  const total = (await store.get("total", { type: "json" })) || { raised: 0, count: 0 };
  if (req.method === "GET") {
    const adjust = Number(Netlify.env.get("KOFI_ADJUST") || 0); // add past support, subtract refunds
    const goal = Number(Netlify.env.get("KOFI_GOAL") || 250);
    const raised = Math.max(0, Math.round((total.raised + adjust) * 100) / 100);
    return new Response(JSON.stringify({ raised, goal, supporters: total.count }), { headers: json });
  }
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let data = null;
  try { data = JSON.parse((await req.formData()).get("data")); } catch (e) { return new Response("Bad request", { status: 400 }); }
  const token = Netlify.env.get("KOFI_TOKEN");
  if (!token || !data || data.verification_token !== token) return new Response("Unauthorized", { status: 401 });
  const id = String(data.kofi_transaction_id || data.message_id || ""), amount = Number(data.amount);
  if (!id || !(amount > 0)) return new Response("OK");
  if (await store.get("tx/" + id)) return new Response("OK"); // Ko-fi retries: count each payment once
  await store.setJSON("tx/" + id, { amount, currency: data.currency, type: data.type, at: data.timestamp });
  await store.setJSON("total", { raised: total.raised + amount, count: total.count + 1 });
  return new Response("OK");
};

export const config = { path: ["/api/kofi", "/api/support"] };
