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

const chartData = [
  { month: "Jan", income: 4000, expense: 2400 },
  { month: "Feb", income: 3000, expense: 1398 },
  { month: "Mar", income: 2000, expense: 9800 },
  { month: "Apr", income: 2780, expense: 3908 },
  { month: "May", income: 1890, expense: 4800 },
  { month: "Jun", income: 2390, expense: 3800 },
];

export function IncomeExpenseChart() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-700">
      <h2 className="text-lg font-bold text-foreground mb-6">
        Income vs Expense
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1F2C2D",
              border: "1px solid #4C1D95",
              borderRadius: "8px",
            }}
            cursor={{ fill: "rgba(143, 191, 189, 0.16)" }}
          />
          <Legend />
          <Bar dataKey="income" fill="#7353f6" radius={[8, 8, 0, 0]} isAnimationActive animationDuration={900} animationEasing="ease-out" />
          <Bar dataKey="expense" fill="#B39DFF" radius={[8, 8, 0, 0]} isAnimationActive animationDuration={1100} animationBegin={120} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

