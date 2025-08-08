"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface CompletionRateChartProps {
  data: {
    name: string
    completed: number
    total: number
  }[]
}

export function CompletionRateChart({ data }: CompletionRateChartProps) {
  const formattedData = data.map((item) => ({
    name: item.name,
    "Completion Rate": (item.completed / item.total) * 100,
  }))

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis unit="%" />
          <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, "Completion Rate"]} />
          <Bar dataKey="Completion Rate" fill="#4ade80" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
