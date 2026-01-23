import QRCode, { QRCodeErrorCorrectionLevel } from "qrcode";

export interface QRCodeOptions {
  size?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
  errorCorrectionLevel?: QRCodeErrorCorrectionLevel;
}

const defaults: Required<QRCodeOptions> = {
  size: 300,
  margin: 2,
  darkColor: "#000000",
  lightColor: "#ffffff",
  errorCorrectionLevel: "M",
};

export async function generateQRCode(
  url: string,
  options?: QRCodeOptions
): Promise<string> {
  const config = { ...defaults, ...options };

  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: config.size,
      margin: config.margin,
      errorCorrectionLevel: config.errorCorrectionLevel,
      color: {
        dark: config.darkColor,
        light: config.lightColor,
      },
    });
    return dataUrl;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to generate QR code: ${message}`);
  }
}

export async function generateQRCodeSVG(
  url: string,
  options?: QRCodeOptions
): Promise<string> {
  const config = { ...defaults, ...options };

  try {
    const svg = await QRCode.toString(url, {
      type: "svg",
      width: config.size,
      margin: config.margin,
      errorCorrectionLevel: config.errorCorrectionLevel,
      color: {
        dark: config.darkColor,
        light: config.lightColor,
      },
    });
    return svg;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to generate QR code SVG: ${message}`);
  }
}
