// video-proxy — streams GitHub release assets with proper Range support
// Resolves the signed-URL redirect chain and forwards range requests

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ASSETS: Record<string, string> = {
  "mma-june-18": "https://github.com/ds016683/mma-tracker/releases/download/media-v1/mma-june-18.mp4",
};

serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Range, Authorization, apikey",
    "Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const key = url.pathname.split("/").pop()?.replace(".mp4", "") ?? "";
  const assetUrl = ASSETS[key];

  if (!assetUrl) {
    return new Response("Not found", { status: 404, headers: corsHeaders });
  }

  // Follow redirects to get the actual signed CDN URL
  const proxyHeaders: HeadersInit = { "User-Agent": "Mozilla/5.0" };
  const range = req.headers.get("Range");
  if (range) proxyHeaders["Range"] = range;

  const upstream = await fetch(assetUrl, {
    headers: proxyHeaders,
    redirect: "follow",
  });

  const responseHeaders = new Headers(corsHeaders);
  const passthroughHeaders = [
    "Content-Type", "Content-Length", "Content-Range",
    "Accept-Ranges", "Last-Modified", "ETag",
  ];
  for (const h of passthroughHeaders) {
    const v = upstream.headers.get(h);
    if (v) responseHeaders.set(h, v);
  }
  // Ensure correct content type for video
  responseHeaders.set("Content-Type", "video/mp4");

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
});
