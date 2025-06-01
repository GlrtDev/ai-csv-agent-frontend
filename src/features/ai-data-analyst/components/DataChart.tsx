import React, { useEffect, useRef } from "react";
import {
  Chart,
  type ChartData as ChartJSType,
  type ChartOptions as ChartJSOptions,
} from "chart.js/auto";
import { type ChartData } from "@/types/appTypes";

interface Props {
  chartData: ChartData | null;
}

const DataChart: React.FC<Props> = ({ chartData }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartData && chartRef.current) {
      const ctx = chartRef.current.getContext("2d");
      if (!ctx) {
        console.error("Could not get 2D rendering context for chart");
        return;
      }

      if (chartInstance.current) {
        chartInstance.current.destroy(); // Destroy the previous chart instance
      }

      const labels = chartData.labelsKey
        ? chartData.data.map(
            (item) => item[chartData.labelsKey as string] as string | number,
          )
        : Object.keys(chartData.data[0] || {});
      const dataValues = chartData.valuesKey
        ? chartData.data.map(
            (item) => item[chartData.valuesKey as string] as number,
          )
        : Object.values(chartData.data[0] || {});

      const data: ChartJSType = {
        labels: labels,
        datasets: [
          {
            label: "Data", // You might want to make this dynamic based on your API response
            data: dataValues,
            backgroundColor: "rgba(54, 162, 235, 0.6)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
        ],
      };

      const options: ChartJSOptions = {
        ...chartData.options,
        responsive: true,
        maintainAspectRatio: false,
      };

      chartInstance.current = new Chart(ctx, {
        type: chartData.chartType,
        data: data,
        options: options,
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [chartData]);

  return <canvas ref={chartRef} />;
};

export default DataChart;
