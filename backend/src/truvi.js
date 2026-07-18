// Truvi supplies its API schema and credentials during account onboarding.
// This adapter deliberately keeps that vendor-specific contract in one place.
export async function createTruviBooking(env, booking) {
  if (!env.TRUVI_CREATE_BOOKING_URL || !env.TRUVI_API_KEY) {
    throw new Error("Truvi API credentials are not configured.");
  }

  const response = await fetch(env.TRUVI_CREATE_BOOKING_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.TRUVI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_reference: booking.id,
      source: "direct",
      check_in: booking.arrival,
      check_out: booking.departure,
      guest: {
        full_name: booking.guestName,
        email: booking.email,
        phone: booking.phone,
      },
      services: ["screening", "id_verification"],
      callback_url: `${env.PUBLIC_API_URL}/webhooks/truvi`,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Truvi returned ${response.status}.`);
  }

  const id = data.id || data.booking_id || data.reference;
  const verificationUrl = data.verification_url || data.guest_url || data.url;
  if (!id || !verificationUrl) {
    throw new Error("Truvi response did not include a booking ID and guest verification URL.");
  }

  return {
    id: String(id),
    verificationUrl: String(verificationUrl),
    reportUrl: data.report_url ? String(data.report_url) : "",
    status: normalizeTruviStatus(data.status),
  };
}

export function normalizeTruviWebhook(payload) {
  const resource = payload.booking || payload.data || payload;
  return {
    eventId: String(payload.event_id || payload.id || `${resource.id}:${resource.updated_at || resource.status}`),
    verificationId: String(resource.id || resource.booking_id || resource.reference || ""),
    externalReference: String(resource.external_reference || resource.externalReference || ""),
    status: normalizeTruviStatus(resource.status || resource.screening_status),
    reportUrl: String(resource.report_url || resource.dashboard_url || ""),
  };
}

export function normalizeTruviStatus(value) {
  const status = String(value || "pending").toLowerCase().replace(/[ -]+/g, "_");
  if (["approved", "verified", "passed", "complete"].includes(status)) return "approved";
  if (["flagged", "review", "in_review", "manual_review"].includes(status)) return "flagged";
  if (["rejected", "failed", "not_approved"].includes(status)) return "rejected";
  return "pending";
}
