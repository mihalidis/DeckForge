import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#E0A64B,#B77A2C)", borderRadius: 40 }}>
        <div style={{ display: "flex", width: 56, height: 56, background: "#0E1116", borderRadius: 8, transform: "rotate(45deg)" }} />
      </div>
    ),
    size,
  );
}
