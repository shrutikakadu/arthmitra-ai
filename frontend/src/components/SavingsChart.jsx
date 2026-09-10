import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function SavingsChart({ data, title = "Micro-Savings Growth Projections" }) {
  const defaultData = [
    { year: '1 Year', rd: 2500, kvp: 2150, jan_dhan: 1200 },
    { year: '3 Years', rd: 7800, kvp: 7400, jan_dhan: 3800 },
    { year: '5 Years', rd: 13500, kvp: 14200, jan_dhan: 6800 },
  ];

  const chartData = data || defaultData;

  return (
    <div style={{ width: '100%', minHeight: 280, display: 'flex', flexDirection: 'column' }}>
      {title && (
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>
          {title}
        </div>
      )}
      <div style={{ width: '100%', height: 240, minHeight: 220, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={5} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
            <Bar dataKey="rd" name="Post Office RD" fill="#FF6B00" radius={[4, 4, 0, 0]} />
            <Bar dataKey="kvp" name="Kisan Vikas Patra" fill="#138808" radius={[4, 4, 0, 0]} />
            <Bar dataKey="jan_dhan" name="Jan Dhan Savings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
