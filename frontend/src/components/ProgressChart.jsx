import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

function ProgressChart({ stats, history = [] }) {
  const doughnutData = {
    labels: ['Known', 'Not Known', 'Unreviewed'],
    datasets: [
      {
        data: [
          stats?.knownCards ?? 0,
          stats?.notKnownCards ?? 0,
          Math.max((stats?.totalCards ?? 0) - (stats?.knownCards ?? 0) - (stats?.notKnownCards ?? 0), 0),
        ],
        backgroundColor: ['#10b981', '#f97316', '#6366f1'],
        borderWidth: 0,
      },
    ],
  };

  const lineData = {
    labels: history.map((item) => item.date),
    datasets: [
      {
        label: 'Reviews completed',
        data: history.map((item) => item.count),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.18)',
        tension: 0.35,
        fill: true,
      },
    ],
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Mastery breakdown</h3>
        <div className="mx-auto max-w-[280px]">
          <Doughnut data={doughnutData} />
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Review trend</h3>
        <Line data={lineData} />
      </div>
    </div>
  );
}

export default ProgressChart;
