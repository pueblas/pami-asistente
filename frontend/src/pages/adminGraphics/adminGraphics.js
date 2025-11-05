import React, { useEffect, useState } from "react";
import "./adminGraphics.css";
import { Line, Bar } from "react-chartjs-2";
import TopBar from "../../components/topBar";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdminGraphics = () => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();
  const [dailyData, setDailyData] = useState([]);
  const [totals, setTotals] = useState({ like: 0, dislike: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Validate role locally first (use localStorage 'role' as quick check)
        const localRole = localStorage.getItem("role");
        if (localRole !== "administrador") {
          setError("No autorizado (rol local insuficiente). Iniciá sesión como administrador.");
          setLoading(false);
          return;
        }

        const token = localStorage.getItem("access_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const resp = await axios.get("http://localhost:8000/feedback/", { headers });

        // resp is list of feedbacks; aggregate by day
        const rows = Array.isArray(resp.data) ? resp.data : [];

        const map = {};
        let likeTotal = 0;
        let dislikeTotal = 0;

        rows.forEach((r) => {
          // defensive parsing: if fecha_creacion is missing, skip
          if (!r || !r.fecha_creacion) return;
          const d = new Date(r.fecha_creacion).toISOString().slice(0, 10);
          if (!map[d]) map[d] = { like: 0, dislike: 0 };
          if (r.me_gusta) {
            map[d].like += 1;
            likeTotal += 1;
          } else {
            map[d].dislike += 1;
            dislikeTotal += 1;
          }
        });

        const ordered = Object.keys(map)
          .sort()
          .map((k) => ({ date: k, ...map[k] }));

        setDailyData(ordered);
        setTotals({ like: likeTotal, dislike: dislikeTotal });
      } catch (err) {
        console.error("Error fetching feedback:", err);
        if (err.response && err.response.status === 401) {
          setError("No autorizado. Iniciá sesión como administrador.");
        } else if (err.response && err.response.status === 403) {
          setError("Acceso denegado. Se requiere rol de administrador.");
        } else {
          setError("Error al obtener datos de feedback. Revisá la consola.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // optionally refresh every minute
    const iv = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  const labels = dailyData.map((d) => d.date);
  // Resolve CSS variables to actual color values because Canvas/ChartJS
  // does not reliably resolve `var(...)` strings when drawing.
  const rootStyle = getComputedStyle(document.documentElement);
  const likeColor = rootStyle.getPropertyValue("--feedback-like-color").trim() || "#28a745";
  const dislikeColor = rootStyle.getPropertyValue("--feedback-dislike-color").trim() || "#d9534f";

  const lineData = {
    labels,
    datasets: [
      {
        label: "Like",
        data: dailyData.map((d) => d.like),
        borderColor: likeColor,
        backgroundColor: "rgba(40,167,69,0.08)",
        pointBackgroundColor: likeColor,
        pointBorderColor: likeColor,
        borderWidth: 2,
        tension: 0.2,
        pointRadius: 4,
      },
      {
        label: "Dislike",
        data: dailyData.map((d) => d.dislike),
        borderColor: dislikeColor,
        backgroundColor: "rgba(217,83,79,0.08)",
        pointBackgroundColor: dislikeColor,
        pointBorderColor: dislikeColor,
        borderWidth: 2,
        tension: 0.2,
        pointRadius: 4,
      },
    ],
  };

  const barData = {
    labels: ["Like", "Dislike"],
    datasets: [
      {
        label: "Total",
        data: [totals.like, totals.dislike],
        backgroundColor: [likeColor, dislikeColor],
        borderColor: [likeColor, dislikeColor],
        borderWidth: 1,
      },
    ],
  };

  const commonOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: function (context) {
            const val = context.parsed ? (context.parsed.y ?? context.parsed) : null;
            return `${context.dataset.label}: ${val}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <>
      <TopBar menuAbierto={menuAbierto} onUserClick={() => setMenuAbierto(!menuAbierto)} />
      <div className="admin__container">
        <div className="admin__box admin-graphics" id="main-content">
          <div className="admin__header">
            <h1 className="admin__title">Estadísticas de Feedback</h1>
          </div>

          {loading ? (
            <div className="chart-card">
              <p>Cargando datos...</p>
            </div>
          ) : error ? (
            <div className="chart-card">
              <p style={{ color: "var(--color-error)" }}>{error}</p>
            </div>
          ) : dailyData.length === 0 ? (
            <div className="chart-card">
              <p>No se encontraron datos de feedback.</p>
            </div>
          ) : (
            <>
              <section className="chart-card">
                <h2>Histórico diario (líneas)</h2>
                <Line data={lineData} options={commonOptions} />
              </section>

              <section className="chart-card">
                <h2>Totales (barras)</h2>
                <Bar data={barData} options={commonOptions} />
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminGraphics;
