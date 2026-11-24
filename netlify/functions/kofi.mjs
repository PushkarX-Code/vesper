// Ko-fi webhook and the live Support total.
// Ko-fi calls POST /api/kofi only for completed payments, so failed or abandoned payments never count.
// GET /api/support returns {raised, goal} for the Support page.
import { getStore } from "@netlify/blobs";

const json = { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store", "Content-Type": "application/json" };

// Conditional writes make the claim and the total update atomic, even when Ko-fi retries or sends two webhooks at once.
async function updateTotal(store, add){
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await store.getWithMetadata("total", {type:"json"});
    const t = (current && current.data) || {raised:0, count:0};
    const next = {raised:t.raised + add, count:t.count + 1};
    const write = await store.setJSON("total", next, current && current.etag ? {onlyIfMatch:current.etag} : {onlyIfNew:true});
    if (write.modified) return;
  }
  throw new Error("Total update conflict");
}

export default async (req) => {
  const store = getStore("support");
  if (req.method === "GET") {
    const total = (await store.get("total", {type:"json"})) || {raised:0};
    const adjust = Number(Netlify.env.get("KOFI_ADJUST") || 0); // add past support, subtract refunds
    const goal = Number(Netlify.env.get("KOFI_GOAL") || 250);
    const raised = Math.max(0, Math.round((total.raised + adjust) * 100) / 100);
    return new Response(JSON.stringify({ raised, goal }), { headers: json });
  }
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let data = null;
  try { data = JSON.parse((await req.formData()).get("data")); } catch (e) { return new Response("Bad request", { status: 400 }); }
  const token = Netlify.env.get("KOFI_TOKEN");
  if (!token || !data || data.verification_token !== token) return new Response("Unauthorized", { status: 401 });
  const id = String(data.kofi_transaction_id || data.message_id || ""), amount = Number(data.amount);
  if (!id || !(amount > 0)) return new Response("OK");
  const claim = await store.setJSON("tx/" + id, {amount, currency:data.currency, type:data.type, at:data.timestamp}, {onlyIfNew:true});
  if (!claim.modified) return new Response("OK"); // counted already
  // The goal is shown in dollars. Only dollar payments are added to it, so an amount in another currency never inflates the total.
  const add = String(data.currency || "USD").toUpperCase() === "USD" ? amount : 0;
  try { await updateTotal(store, add); }
  catch (e) { await store.delete("tx/" + id); return new Response("Total update failed", { status: 500 }); }
  return new Response("OK");
};

export const config = { path: ["/api/kofi", "/api/support"] };
