import { CanvasTexture, SRGBColorSpace } from "three";
export function makePattern(label: string, mode: string) {
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = 1024;
  const g = c.getContext("2d")!;
  if (mode === "calibration") {
    g.fillStyle = "#10262e";
    g.fillRect(0, 0, c.width, c.height);
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 16; x++) {
        g.fillStyle = (x + y) % 2 ? "#294b54" : "#14333c";
        g.fillRect(x * 128, y * 128, 128, 128);
        g.fillStyle = "#9fbbc0";
        g.font = "20px monospace";
        g.fillText(`${x},${7 - y}`, x * 128 + 12, y * 128 + 28);
      }
    g.strokeStyle = "#b9f5d0";
    g.lineWidth = 10;
    g.strokeRect(8, 8, 2032, 1008);
    g.fillStyle = "#dbffe6";
    g.font = "bold 90px sans-serif";
    g.fillText(label.toUpperCase(), 70, 490);
    g.font = "40px monospace";
    g.fillText("↑ TOP     +V ↑     +U →     RIGHT →", 70, 570);
    g.fillStyle = "#f98b72";
    g.fillRect(0, 0, 70, 70);
    g.fillStyle = "#84dafa";
    g.fillRect(1978, 0, 70, 70);
  } else if (mode === "neutral") {
    g.fillStyle = "#657077";
    g.fillRect(0, 0, 2048, 1024);
  } else {
    const grad = g.createLinearGradient(0, 0, 1800, 1024);
    grad.addColorStop(0, "#13172c");
    grad.addColorStop(0.35, "#39336b");
    grad.addColorStop(0.55, "#a45868");
    grad.addColorStop(0.68, "#df9b7e");
    grad.addColorStop(1, "#25334f");
    g.fillStyle = grad;
    g.fillRect(0, 0, 2048, 1024);
    let seed = 71;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < 130; i++) {
      const x = rnd() * 2048,
        y = rnd() * 1024,
        r = 60 + rnd() * 300,
        rad = g.createRadialGradient(x, y, 0, x, y, r);
      rad.addColorStop(
        0,
        `rgba(${rnd() > 0.5 ? "226,142,174" : "74,78,152"},.08)`,
      );
      rad.addColorStop(1, "transparent");
      g.fillStyle = rad;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 1700; i++) {
      g.globalAlpha = 0.15 + rnd() * 0.65;
      g.fillStyle = "#fff3e5";
      g.beginPath();
      g.arc(rnd() * 2048, rnd() * 1024, 0.4 + rnd() * 1.3, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}
