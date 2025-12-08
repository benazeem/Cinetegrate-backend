import { fetch } from "undici";

export async function getIpInfo(ip: string) {
  try {
    const res = await fetch(`https://free.freeipapi.com/api/json/${ip}`);
    const data = await res.json();
    return data;
  } catch (e) {
    console.log(e);
    return { city: "Unknown", country: "Unknown" };
  }
}
