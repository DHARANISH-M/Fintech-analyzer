import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const lineData = [
  { date: "1 Mar", balance: 12000 },
  { date: "5 Mar", balance: 15000 },
  { date: "10 Mar", balance: 13500 },
  { date: "15 Mar", balance: 18000 },
  { date: "20 Mar", balance: 16800 },
  { date: "25 Mar", balance: 20100 },
  { date: "30 Mar", balance: 19500 },
];

export function NetBalanceTrendChart() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-700">
      <h2 className="text-lg font-bold text-foreground mb-6">
        Net Balance Trend
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={lineData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1F2C2D",
              border: "1px solid #4C1D95",
              borderRadius: "8px",
            }}
            cursor={{ fill: "rgba(143, 191, 189, 0.16)" }}
          />
          <Line
            type="monotone"
            dataKey="balance"
            stroke="#7353f6"
            strokeWidth={3}
            dot={{ fill: "#7353f6", r: 5 }}
            activeDot={{ r: 7 }}
            isAnimationActive
            animationDuration={1100}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

