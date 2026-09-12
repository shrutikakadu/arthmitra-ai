import { ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import { useLanguage } from '../LanguageContext';

export default function ScoreGauge({ score = 74, grade = "B", label = null }) {
  const { t } = useLanguage();
  const displayLabel = label || t("health_standing_good") || "Good Standing";
  const data = [{ name: 'Score', value: score, fill: score >= 80 ? '#138808' : score >= 65 ? '#16a34a' : score >= 50 ? '#FF6B00' : '#ef4444' }];

  return (
    <div style={{ width: '100%', minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', height: 180, position: 'relative', minHeight: 160 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={160}>
          <RadialBarChart cx="50%" cy="60%" innerRadius="70%" outerRadius="100%" barSize={16} data={data} startAngle={180} endAngle={0}>
            <RadialBar minAngle={15} background={{ fill: '#f1f5f9' }} clockWise dataKey="value" cornerRadius={10} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div style={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: data[0].fill, fontFamily: "'Inter', sans-serif" }}>
            {score}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            {displayLabel} (Grade {grade})
          </div>
        </div>
      </div>
    </div>
  );
}
