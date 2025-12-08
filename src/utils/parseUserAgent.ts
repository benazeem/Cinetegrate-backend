import { UAParser } from "ua-parser-js";

export function parseUserAgent(Agent: string) {
  const parser = new UAParser(Agent);

  return {
    browser: parser.getBrowser(),
    os: parser.getOS(),
    device: parser.getDevice(),
    cpu: parser.getCPU().architecture,
    engine: parser.getEngine().name,
  };
}
