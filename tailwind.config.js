export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "brand-dark": "#030712",
        "brand-light": "#f8fafc",
        "brand-muted": "rgba(248,250,252,0.72)",
        "accent-primary": "#38bdf8",
        "accent-secondary": "#818cf8",
        "danger": "#ef4444"
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 18px 45px rgba(15,23,42,0.45)",
        soft: "0 12px 30px rgba(56,189,248,0.35)"
      },
      backgroundImage: {
        "radial-panel": "radial-gradient(circle at top left, #1f2937, #0b1120 55%, #030712 100%)"
      }
    }
  },
  plugins: []
};
