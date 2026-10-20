// Parses a Valorant crosshair import string into renderable properties.
//
// Format: semicolon-delimited key/value pairs.
// Sections:
//   P = primary crosshair
//   0 = inner lines
//   1 = outer lines
//   S = center dot
//
// Reference keys (Valorant crosshair schema):
//   c  = color (0=white,1=green,2=greenish,3=yellow,4=cyan,5=pink,6=red,7=custom)
//   h  = outlines enabled (0/1)
//   o  = outline opacity
//   t  = outline thickness
//   0t = inner thickness,  0l = inner length,  0o = inner offset,
//   0a = inner opacity,    0f = inner firing error,  0m = inner movement error
//   1t = outer thickness,  1l = outer length,  1o = outer offset,
//   1a = outer opacity,    1f = outer firing error,  1m = outer movement error
//   d  = center dot enabled (0/1)
//   z  = dot size
//   a  = dot opacity
//   f  = dot firing error
//   m  = dot movement error

export interface CrosshairLine {
  enabled: boolean;
  thickness: number;
  length: number;
  offset: number;
  opacity: number;
  firingError: boolean;
  movementError: boolean;
}

export interface CrosshairDot {
  enabled: boolean;
  size: number;
  opacity: number;
}

export interface ParsedCrosshair {
  color: string;
  outlines: boolean;
  outlineOpacity: number;
  outlineThickness: number;
  inner: CrosshairLine;
  outer: CrosshairLine;
  dot: CrosshairDot;
}

const COLOR_MAP: Record<number, string> = {
  0: "#ffffff",
  1: "#00ff00",
  2: "#7fff00",
  3: "#ffff00",
  4: "#00ffff",
  5: "#ff00ff",
  6: "#ff0000",
  7: "#ffffff",
};

export function parseCrosshair(code: string): ParsedCrosshair {
  const tokens = code.split(";");
  const map: Record<string, string> = {};

  for (let i = 0; i < tokens.length; i++) {
    const key = tokens[i];
    const val = tokens[i + 1];
    if (key && val !== undefined) {
      map[key] = val;
    }
  }

  const colorIdx = parseInt(map["c"] ?? "0", 10);
  const color = COLOR_MAP[colorIdx] ?? "#ffffff";

  const outlines = map["h"] === "1";
  const outlineOpacity = parseFloat(map["o"] ?? "1");
  const outlineThickness = parseFloat(map["t"] ?? "0");

  const inner: CrosshairLine = {
    enabled: true,
    thickness: parseFloat(map["0t"] ?? "0"),
    length: parseFloat(map["0l"] ?? "0"),
    offset: parseFloat(map["0o"] ?? "0"),
    opacity: parseFloat(map["0a"] ?? "1"),
    firingError: map["0f"] === "1",
    movementError: map["0m"] === "1",
  };

  const outer: CrosshairLine = {
    enabled: true,
    thickness: parseFloat(map["1t"] ?? "0"),
    length: parseFloat(map["1l"] ?? "0"),
    offset: parseFloat(map["1o"] ?? "0"),
    opacity: parseFloat(map["1a"] ?? "1"),
    firingError: map["1f"] === "1",
    movementError: map["1m"] === "1",
  };

  const dot: CrosshairDot = {
    enabled: map["d"] === "1",
    size: parseFloat(map["z"] ?? "1"),
    opacity: parseFloat(map["a"] ?? "1"),
  };

  return {
    color,
    outlines,
    outlineOpacity,
    outlineThickness,
    inner,
    outer,
    dot,
  };
}
