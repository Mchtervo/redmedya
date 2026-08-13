import assert from "node:assert/strict";
import test from "node:test";
import { isMetaNativeBridgeNoise } from "@/lib/meta-pixel-bridge";
import { META_CAPI_ALLOWED } from "@/lib/meta-pixel";
import { PIXEL_REDIRECT_DELAY_MS } from "@/lib/paket/whatsapp-redirect";

test("iOS webkit.messageHandlers gürültüsü native bridge olarak tanınır", () => {
  assert.equal(
    isMetaNativeBridgeNoise(
      "TypeError: undefined is not an object (evaluating 'window.webkit.messageHandlers')"
    ),
    true
  );
});

test("Android postMessage Java object is gone gürültü olarak tanınır", () => {
  assert.equal(
    isMetaNativeBridgeNoise(
      "Uncaught Error: Error invoking postMessage: Java object is gone"
    ),
    true
  );
  assert.equal(isMetaNativeBridgeNoise("TypeError: cannot read foo"), false);
});

test("WhatsAppClick ve Purchase CAPI allowlist'te", () => {
  assert.equal(META_CAPI_ALLOWED.has("WhatsAppClick"), true);
  assert.equal(META_CAPI_ALLOWED.has("Purchase"), true);
  assert.equal(META_CAPI_ALLOWED.has("Lead"), false);
  assert.equal(META_CAPI_ALLOWED.has("Contact"), false);
});

test("pixel sonrası WhatsApp yönlendirme gecikmesi ~350ms", () => {
  assert.equal(PIXEL_REDIRECT_DELAY_MS, 350);
});
