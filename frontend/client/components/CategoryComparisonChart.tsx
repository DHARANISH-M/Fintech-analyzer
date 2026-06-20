import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const categoryComparison = [
  { category: "Food", march: 8500, april: 7200, may: 6800 },
  { category: "Transport", march: 5200, april: 6100, may: 5500 },
  { category: "Entertainment", march: 3800, april: 4500, may: 3200 },
  { category: "Utilities", march: 4100, april: 4300, may: 4500 },
  { category: "Subscriptions", march: 5100, april: 5800, may: 5100 },
  { category: "Other", march: 1750, april: 3300, may: 1900 },
];

export function CategoryComparisonChart() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-700">
      <h2 className="text-lg font-bold text-foreground mb-6">
        Category Comparison (3 Months)
      </h2>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={categoryComparison}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="category" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1F2C2D",
              border: "1px solid #4C1D95",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Bar dataKey="march" fill="#7353f6" radius={[8, 8, 0, 0]} isAnimationActive animationDuration={900} animationEasing="ease-out" />
          <Bar dataKey="april" fill="#C4B5FD" radius={[8, 8, 0, 0]} isAnimationActive animationDuration={1000} animationBegin={100} animationEasing="ease-out" />
          <Bar dataKey="may" fill="#78AFAE" radius={[8, 8, 0, 0]} isAnimationActive animationDuration={1100} animationBegin={200} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

