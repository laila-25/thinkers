import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const colors = ['#F5C542', '#0B132B', '#3B82F6', '#10B981', '#8B5CF6', '#F97316', '#EC4899', '#64748B'];
const tooltipStyle = { borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 16px 40px -24px rgba(15,23,42,.5)' };

export function TrendChart({ data, color = '#F5C542', type = 'area' }) {
  return <ResponsiveContainer width="100%" height={280}>{type === 'bar' ? <BarChart data={data}><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0"/><XAxis dataKey="label" tickLine={false} axisLine={false}/><YAxis allowDecimals={false} tickLine={false} axisLine={false}/><Tooltip contentStyle={tooltipStyle}/><Bar dataKey="value" fill={color} radius={[8, 8, 0, 0]}/></BarChart> : <AreaChart data={data}><defs><linearGradient id={`fill-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.38}/><stop offset="95%" stopColor={color} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0"/><XAxis dataKey="label" tickLine={false} axisLine={false}/><YAxis allowDecimals={false} tickLine={false} axisLine={false}/><Tooltip contentStyle={tooltipStyle}/><Area type="monotone" dataKey="value" stroke={color} strokeWidth={3} fill={`url(#fill-${color.replace('#', '')})`}/></AreaChart>}</ResponsiveContainer>;
}

export function DistributionChart({ data }) {
  return <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={data} dataKey="value" nameKey="label" innerRadius={62} outerRadius={102} paddingAngle={3}>{data.map((item, index) => <Cell key={item.label} fill={colors[index % colors.length]}/>)}</Pie><Tooltip contentStyle={tooltipStyle}/></PieChart></ResponsiveContainer>;
}
