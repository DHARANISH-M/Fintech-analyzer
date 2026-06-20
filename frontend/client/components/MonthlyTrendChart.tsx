import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const monthlyData = [
  { month: "Jan", spending: 28500, income: 42000, savings: 13500 },
  { month: "Feb", spending: 32100, income: 42000, savings: 9900 },
  { month: "Mar", spending: 28450, income: 45320, savings: 16870 },
  { month: "Apr", spending: 31200, income: 43000, savings: 11800 },
  { month: "May", spending: 26800, income: 44500, savings: 17700 },
  { month: "Jun", spending: 29500, income: 46000, savings: 16500 },
];

export function MonthlyTrendChart() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-700">
      <h2 className="text-lg font-bold text-foreground mb-6">Monthly Trends</h2>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1F2C2D",
              border: "1px solid #4C1D95",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#78AFAE"
            strokeWidth={2}
            dot={{ fill: "#78AFAE", r: 4 }}
            isAnimationActive
            animationDuration={900}
            animationEasing="ease-out"
          />
          <Line
            type="monotone"
            dataKey="spending"
            stroke="#C4B5FD"
            strokeWidth={2}
            dot={{ fill: "#C4B5FD", r: 4 }}
            isAnimationActive
            animationDuration={1000}
            animationBegin={100}
            animationEasing="ease-out"
          />
          <Line
            type="monotone"
            dataKey="savings"
            stroke="#7353f6"
            strokeWidth={2}
            dot={{ fill: "#7353f6", r: 4 }}
            isAnimationActive
            animationDuration={1100}
            animationBegin={200}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

