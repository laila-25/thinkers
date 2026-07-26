import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from 'recharts';

const tooltipStyle = {
  borderRadius: 14,
  border: '1px solid rgba(148,163,184,.35)',
  boxShadow: '0 18px 45px -28px rgba(15,23,42,.65)',
};

export function RevenueChart({ data, currency }) {
  return <ResponsiveContainer width="100%" height={260}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id="instructor-revenue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#F5C542" stopOpacity={0.45}/>
          <stop offset="95%" stopColor="#F5C542" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#94a3b833"/>
      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }}/>
      <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }}/>
      <Tooltip contentStyle={tooltipStyle} formatter={value => [`${Number(value).toFixed(2)} ${currency}`, '']}/>
      <Area type="monotone" dataKey="value" stroke="#D69E1E" strokeWidth={3} fill="url(#instructor-revenue)"/>
    </AreaChart>
  </ResponsiveContainer>;
}

export function CourseSalesChart({ data }) {
  return <ResponsiveContainer width="100%" height={260}>
    <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
      <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#94a3b833"/>
      <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }}/>
      <YAxis type="category" dataKey="label" width={110} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }}/>
      <Tooltip contentStyle={tooltipStyle}/>
      <Bar dataKey="value" fill="#3B82F6" radius={[0, 8, 8, 0]}/>
    </BarChart>
  </ResponsiveContainer>;
}
