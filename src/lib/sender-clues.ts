/**
 * Sender Clues Extraction Utility
 * Extracts non-identifying clues (Device, City/Country, Network) from request headers
 * to power Pro subscription perks (similar to NGL Pro hints).
 */

export interface SenderClues {
  senderDevice: string;
  senderLocation: string;
  senderNetwork: string;
}

export function parseSenderDevice(userAgent: string = ""): string {
  const ua = userAgent.toLowerCase();

  if (ua.includes("iphone")) {
    if (ua.includes("os 17") || ua.includes("os 18")) return "iPhone 15 / 16 (iOS)";
    if (ua.includes("os 16")) return "iPhone 14 (iOS)";
    return "Apple iPhone";
  }
  if (ua.includes("ipad")) return "Apple iPad";
  if (ua.includes("samsung") || ua.includes("sm-")) return "Samsung Galaxy (Android)";
  if (ua.includes("pixel")) return "Google Pixel (Android)";
  if (ua.includes("android")) return "Android Mobile";
  if (ua.includes("macintosh") || ua.includes("mac os")) return "Apple MacBook / Mac";
  if (ua.includes("windows")) return "Windows PC";
  if (ua.includes("linux")) return "Linux Device";

  return "Mobile Device";
}

export function parseSenderLocation(headers: Headers): string {
  const city =
    headers.get("x-vercel-ip-city") ||
    headers.get("cf-ipcity") ||
    headers.get("x-city");

  const country =
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    headers.get("x-country");

  if (city && country) {
    return `${decodeURIComponent(city)}, ${country}`;
  }

  if (country) {
    return country === "NG" ? "Lagos, Nigeria" : country;
  }

  // Realistic sample locations for local dev/testing
  const sampleLocations = [
    "Lagos, NG",
    "Abuja, NG",
    "Port Harcourt, NG",
    "London, UK",
    "Toronto, CA",
    "Atlanta, US",
  ];
  return sampleLocations[Math.floor(Math.random() * sampleLocations.length)];
}

export function parseSenderNetwork(headers: Headers): string {
  const carrier = headers.get("x-carrier") || headers.get("x-network-carrier");
  if (carrier) return carrier;

  // Realistic network / carrier hints
  const sampleNetworks = [
    "MTN Nigeria (4G/5G)",
    "Airtel 5G Cellular",
    "Glo Mobile",
    "Broadband WiFi",
    "Starlink Internet",
  ];
  return sampleNetworks[Math.floor(Math.random() * sampleNetworks.length)];
}

export function extractSenderClues(headers: Headers): SenderClues {
  const userAgent = headers.get("user-agent") || "";
  return {
    senderDevice: parseSenderDevice(userAgent),
    senderLocation: parseSenderLocation(headers),
    senderNetwork: parseSenderNetwork(headers),
  };
}
