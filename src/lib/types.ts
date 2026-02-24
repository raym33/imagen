export type TextElement = {
  id: string;
  content: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  fontSize: number; // px at 1080px canvas
  color: string;
  fontWeight: string;
  fontStyle: "normal" | "italic";
  align: CanvasTextAlign;
  opacity: number;
};

export type LogoConfig = {
  dataUrl: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  scale: number; // 0.1 - 2
} | null;

export type SlideConfig = {
  texts: TextElement[];
  overlayColor: string;
  overlayOpacity: number;
  logo: LogoConfig;
};

export function createDefaultSlides(): SlideConfig[] {
  return [
    {
      overlayColor: "#000000",
      overlayOpacity: 0.15,
      logo: null,
      texts: [
        {
          id: "1a",
          content: "scuffers",
          x: 8,
          y: 10,
          fontSize: 42,
          color: "#ffffff",
          fontWeight: "700",
          fontStyle: "italic",
          align: "left",
          opacity: 1,
        },
        {
          id: "1b",
          content: "Easy Returns  •  Worldwide Shipping",
          x: 8,
          y: 45,
          fontSize: 16,
          color: "#ffffff",
          fontWeight: "400",
          fontStyle: "normal",
          align: "left",
          opacity: 0.7,
        },
        {
          id: "1c",
          content: "Best Sellers",
          x: 8,
          y: 85,
          fontSize: 28,
          color: "#ffffff",
          fontWeight: "600",
          fontStyle: "normal",
          align: "left",
          opacity: 1,
        },
      ],
    },
    {
      overlayColor: "#000000",
      overlayOpacity: 0.25,
      logo: null,
      texts: [
        {
          id: "2a",
          content: "Best Sellers",
          x: 50,
          y: 48,
          fontSize: 38,
          color: "#ffffff",
          fontWeight: "700",
          fontStyle: "normal",
          align: "center",
          opacity: 1,
        },
        {
          id: "2b",
          content: "shop now",
          x: 50,
          y: 55,
          fontSize: 32,
          color: "#ffffff",
          fontWeight: "400",
          fontStyle: "italic",
          align: "center",
          opacity: 0.85,
        },
        {
          id: "2c",
          content: "10% off your first order  •  Limited Pieces",
          x: 50,
          y: 92,
          fontSize: 14,
          color: "#ffffff",
          fontWeight: "400",
          fontStyle: "normal",
          align: "center",
          opacity: 0.6,
        },
      ],
    },
    {
      overlayColor: "#000000",
      overlayOpacity: 0.1,
      logo: null,
      texts: [
        {
          id: "3a",
          content: "Best Sellers",
          x: 50,
          y: 15,
          fontSize: 72,
          color: "#ffffff",
          fontWeight: "800",
          fontStyle: "normal",
          align: "center",
          opacity: 1,
        },
        {
          id: "3b",
          content: "Shop Now",
          x: 50,
          y: 25,
          fontSize: 72,
          color: "#ffffff",
          fontWeight: "800",
          fontStyle: "normal",
          align: "center",
          opacity: 1,
        },
      ],
    },
    {
      overlayColor: "#000000",
      overlayOpacity: 0.3,
      logo: null,
      texts: [
        {
          id: "4a",
          content: "scuffers",
          x: 50,
          y: 65,
          fontSize: 56,
          color: "#ffffff",
          fontWeight: "800",
          fontStyle: "italic",
          align: "center",
          opacity: 1,
        },
        {
          id: "4b",
          content: "Everyday Urban Aesthetics",
          x: 50,
          y: 72,
          fontSize: 16,
          color: "#ffffff",
          fontWeight: "400",
          fontStyle: "normal",
          align: "center",
          opacity: 0.7,
        },
        {
          id: "4c",
          content: "Easy Returns & Worldwide Shipping",
          x: 50,
          y: 76,
          fontSize: 14,
          color: "#ffffff",
          fontWeight: "400",
          fontStyle: "normal",
          align: "center",
          opacity: 0.6,
        },
      ],
    },
    {
      overlayColor: "#000000",
      overlayOpacity: 0.2,
      logo: null,
      texts: [
        {
          id: "5a",
          content: "SHOP BEST SELLERS",
          x: 92,
          y: 20,
          fontSize: 36,
          color: "#ffffff",
          fontWeight: "800",
          fontStyle: "normal",
          align: "right",
          opacity: 1,
        },
        {
          id: "5b",
          content: "As Always With Love",
          x: 92,
          y: 85,
          fontSize: 42,
          color: "#ffffff",
          fontWeight: "400",
          fontStyle: "italic",
          align: "right",
          opacity: 0.9,
        },
      ],
    },
  ];
}
