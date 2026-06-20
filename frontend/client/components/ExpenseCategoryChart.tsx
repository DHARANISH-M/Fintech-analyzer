import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const categoryData = [
  { name: "Food", value: 8500, fill: "#7353f6" },
  { name: "Transportation", value: 5200, fill: "#78AFAE" },
  { name: "Entertainment", value: 3800, fill: "#C4B5FD" },
  { name: "Utilities", value: 4100, fill: "#573ec4" },
  { name: "Other", value: 6850, fill: "#B39DFF" },
];

export function ExpenseCategoryChart() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-700">
      <h2 className="text-lg font-bold text-foreground mb-6">
        Expense Categories
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={categoryData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ₹${value.toLocaleString()}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            isAnimationActive
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {categoryData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export { categoryData };

