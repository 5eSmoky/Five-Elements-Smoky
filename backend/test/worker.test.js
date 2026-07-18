import test from "node:test";
import assert from "node:assert/strict";
import { dateRange, rangeBlocked, verifyStripeSignature } from "../src/worker.js";
import { normalizeTruviStatus, normalizeTruviWebhook } from "../src/truvi.js";

test("dateRange excludes checkout date", () => {
  assert.deepEqual(dateRange("2026-08-01", "2026-08-04"), ["2026-08-01", "2026-08-02", "2026-08-03"]);
});

test("rangeBlocked detects a blocked stay night", () => {
  assert.equal(rangeBlocked("2026-08-01", "2026-08-04", ["2026-08-03"]), true);
  assert.equal(rangeBlocked("2026-08-01", "2026-08-04", ["2026-08-04"]), false);
});

test("Truvi statuses normalize without trusting client values", () => {
  assert.equal(normalizeTruviStatus("In Review"), "flagged");
  assert.equal(normalizeTruviStatus("Not Approved"), "rejected");
  assert.equal(normalizeTruviStatus("unknown"), "pending");
});

test("Truvi webhook normalization supports account payload aliases", () => {
  assert.deepEqual(normalizeTruviWebhook({ id: "evt_1", data: { booking_id: "tv_1", external_reference: "req_1", status: "Approved" } }), {
    eventId: "evt_1",
    verificationId: "tv_1",
    externalReference: "req_1",
    status: "approved",
    reportUrl: "",
  });
});

test("Stripe webhook signatures are validated and stale signatures are rejected", async () => {
  const payload = JSON.stringify({ id: "evt_test" });
  const secret = "whsec_test";
  const timestamp = Math.floor(Date.now() / 1000);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`)));
  const signature = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");

  assert.equal(await verifyStripeSignature(payload, `t=${timestamp},v1=${signature}`, secret), true);
  assert.equal(await verifyStripeSignature(payload, `t=${timestamp - 600},v1=${signature}`, secret), false);
  assert.equal(await verifyStripeSignature(`${payload}x`, `t=${timestamp},v1=${signature}`, secret), false);
});
