import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Helpers ──

function base64ToUint8Array(b64: string): Uint8Array {
  // Strip data URL prefix if present
  const raw = b64.includes(",") ? b64.split(",")[1] : b64;
  const binary = atob(raw);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ── Apple App Store Connect ──

async function createAppleJWT(issuerId: string, keyId: string, privateKeyPem: string): Promise<string> {
  const header = { alg: "ES256", kid: keyId, typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: issuerId, iat: now, exp: now + 1200, aud: "appstoreconnect-v1" };

  const enc = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const signingInput = `${headerB64}.${payloadB64}`;

  // Import the private key
  const pemBody = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const keyData = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    enc.encode(signingInput)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${signingInput}.${sigB64}`;
}

async function uploadToAppStore(
  jwt: string,
  appId: string,
  version: string,
  assets: { base64: string; width: number; height: number; label: string }[]
) {
  const baseUrl = "https://api.appstoreconnect.apple.com/v1";
  const headers = { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };

  // Find the app version
  const versionsRes = await fetch(
    `${baseUrl}/apps/${appId}/appStoreVersions?filter[versionString]=${version}&filter[platform]=IOS`,
    { headers }
  );
  if (!versionsRes.ok) {
    const txt = await versionsRes.text();
    throw new Error(`Failed to find app version [${versionsRes.status}]: ${txt}`);
  }

  const versionsData = await versionsRes.json();
  const versionId = versionsData.data?.[0]?.id;
  if (!versionId) throw new Error(`Version ${version} not found for app ${appId}`);

  // Get localizations
  const locRes = await fetch(`${baseUrl}/appStoreVersions/${versionId}/appStoreVersionLocalizations`, { headers });
  if (!locRes.ok) throw new Error(`Failed to get localizations [${locRes.status}]`);
  const locData = await locRes.json();
  const locId = locData.data?.[0]?.id;
  if (!locId) throw new Error("No localizations found for this version");

  // Get screenshot sets
  const setsRes = await fetch(`${baseUrl}/appStoreVersionLocalizations/${locId}/appScreenshotSets`, { headers });
  const setsData = await setsRes.json();

  let uploaded = 0;
  for (const asset of assets) {
    const bytes = base64ToUint8Array(asset.base64);

    // Determine display type from dimensions
    let displayType = "APP_IPHONE_65";
    if (asset.width === 2048 || asset.width === 2732) displayType = "APP_IPAD_PRO_129";
    if (asset.width === 422 || asset.width === 410) displayType = "APP_APPLE_WATCH_SERIES_4";

    // Find or create screenshot set for this display type
    let setId = setsData.data?.find((s: any) => s.attributes?.screenshotDisplayType === displayType)?.id;

    if (!setId) {
      const createSetRes = await fetch(`${baseUrl}/appScreenshotSets`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          data: {
            type: "appScreenshotSets",
            attributes: { screenshotDisplayType: displayType },
            relationships: {
              appStoreVersionLocalization: { data: { type: "appStoreVersionLocalizations", id: locId } },
            },
          },
        }),
      });
      if (!createSetRes.ok) {
        console.error(`Failed to create screenshot set for ${displayType}`);
        continue;
      }
      const createSetData = await createSetRes.json();
      setId = createSetData.data?.id;
    }

    // Reserve screenshot upload
    const reserveRes = await fetch(`${baseUrl}/appScreenshots`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: {
          type: "appScreenshots",
          attributes: { fileSize: bytes.length, fileName: `${asset.label}.png` },
          relationships: { appScreenshotSet: { data: { type: "appScreenshotSets", id: setId } } },
        },
      }),
    });

    if (!reserveRes.ok) {
      console.error(`Failed to reserve screenshot upload [${reserveRes.status}]`);
      continue;
    }

    const reserveData = await reserveRes.json();
    const uploadOps = reserveData.data?.attributes?.uploadOperations;
    const screenshotId = reserveData.data?.id;

    if (uploadOps?.length) {
      for (const op of uploadOps) {
        const opHeaders: Record<string, string> = {};
        for (const h of op.requestHeaders) opHeaders[h.name] = h.value;
        const chunk = bytes.slice(op.offset, op.offset + op.length);
        await fetch(op.url, { method: op.method, headers: opHeaders, body: chunk });
      }

      // Commit
      await fetch(`${baseUrl}/appScreenshots/${screenshotId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          data: { type: "appScreenshots", id: screenshotId, attributes: { uploaded: true, sourceFileChecksum: null } },
        }),
      });
    }

    uploaded++;
  }

  return { uploaded, total: assets.length };
}

// ── Google Play Store ──

async function getGoogleAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const enc = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const signingInput = `${headerB64}.${payloadB64}`;

  // Import RSA key
  const pemBody = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const keyData = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(signingInput));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${signingInput}.${sigB64}`;

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const txt = await tokenRes.text();
    throw new Error(`Failed to get Google access token [${tokenRes.status}]: ${txt}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

async function uploadToPlayStore(
  accessToken: string,
  packageName: string,
  editIdInput: string | undefined,
  assets: { base64: string; width: number; height: number; label: string }[]
) {
  const baseUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}`;
  const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

  // Create or use existing edit
  let editId = editIdInput;
  if (!editId) {
    const editRes = await fetch(`${baseUrl}/edits`, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    });
    if (!editRes.ok) {
      const txt = await editRes.text();
      throw new Error(`Failed to create edit [${editRes.status}]: ${txt}`);
    }
    const editData = await editRes.json();
    editId = editData.id;
  }

  let uploaded = 0;
  for (const asset of assets) {
    const bytes = base64ToUint8Array(asset.base64);

    // Determine image type based on dimensions
    let imageType = "phoneScreenshots";
    if (asset.width === 1200 || (asset.width === 1920 && asset.height === 1200)) imageType = "sevenInchScreenshots";
    if (asset.width === 1600 || asset.width === 2560) imageType = "tenInchScreenshots";

    const uploadRes = await fetch(
      `${baseUrl}/edits/${editId}/listings/en-US/images/${imageType}:upload`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "image/png" },
        body: bytes,
      }
    );

    if (!uploadRes.ok) {
      console.error(`Failed to upload [${uploadRes.status}]: ${await uploadRes.text()}`);
      continue;
    }
    uploaded++;
  }

  // Commit the edit
  await fetch(`${baseUrl}/edits/${editId}:commit`, { method: "POST", headers });

  return { uploaded, total: assets.length, editId };
}

// ── Main handler ──

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { store } = body;

    if (store === "ios") {
      const { issuerId, keyId, privateKey, appId, version, assets } = body;
      if (!issuerId || !keyId || !privateKey || !appId || !version) {
        throw new Error("Missing required iOS credentials (issuerId, keyId, privateKey, appId, version)");
      }

      const jwt = await createAppleJWT(issuerId, keyId, privateKey);
      const result = await uploadToAppStore(jwt, appId, version, assets);

      return new Response(
        JSON.stringify({ message: `Uploaded ${result.uploaded}/${result.total} screenshots to App Store Connect.` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (store === "android") {
      const { serviceAccountJson, packageName, editId, assets } = body;
      if (!serviceAccountJson || !packageName) {
        throw new Error("Missing required Android credentials (serviceAccountJson, packageName)");
      }

      const accessToken = await getGoogleAccessToken(serviceAccountJson);
      const result = await uploadToPlayStore(accessToken, packageName, editId, assets);

      return new Response(
        JSON.stringify({ message: `Uploaded ${result.uploaded}/${result.total} screenshots to Google Play. Edit ID: ${result.editId}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid store parameter. Use 'ios' or 'android'.");
  } catch (e) {
    console.error("upload-to-store error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
