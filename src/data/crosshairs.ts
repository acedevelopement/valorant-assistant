export interface Crosshair {
  id: string;
  name: string;
  author: string;
  code: string;
  previewUrl: string | null;
  tags: string[];
}

export const CROSSHAIRS: Crosshair[] = [
  {
    id: "sacy",
    name: "Sacy",
    author: "Sentinels",
    code: "0;P;h;0;f;0;0t;1;0l;4;0o;1;0a;1;0f;0;1t;3;1o;2;1a;1;1m;0;1f;0",
    previewUrl: null,
    tags: ["pro"],
  },
];
