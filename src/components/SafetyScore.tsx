import { Shield } from "lucide-react";

interface Props {
  score: number;
}

export default function SafetyScore({ score }: Props) {
  let colour = "#22c55e";
  let level = "LOW THREAT";

  if (score < 75) {
    colour = "#f59e0b";
    level = "MEDIUM THREAT";
  }

  if (score < 50) {
    colour = "#ef4444";
    level = "HIGH THREAT";
  }

  return (
    <div
      style={{
        background: colour,
        color: "white",
        borderRadius: 16,
        padding: "12px",
        textAlign: "center",
        fontWeight: 600,
        boxShadow: "0 8px 24px rgba(0,0,0,.25)",
      }}
    >
      <Shield size={18} style={{ marginBottom: 4 }} />

      <div style={{ fontSize: 26, fontWeight: 700 }}>
        {score}/100
      </div>

      <div>{level}</div>
    </div>
  );
}