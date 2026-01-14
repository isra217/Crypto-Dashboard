import { useEffect, useState, useMemo, useCallback } from "react";
import "./App.css";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import {
  FiTrendingUp,
  FiBriefcase,
  FiBell,
  FiStar,
  FiSearch,
  FiBarChart2,
  FiPieChart,
  FiDollarSign,
  FiGlobe,
  FiHome,
  FiSettings,
  FiAlertCircle,
  FiArrowUp,
  FiArrowDown,
  FiChevronRight,
  FiX,
  FiCheck,
  FiPlus,
  FiTrash2,
  FiRefreshCw,
  FiEdit2,
  FiPercent,
  FiDollarSign as FiDollar,
  FiTrendingUp as FiTrending,
  FiTrendingDown
} from "react-icons/fi";
import { FaBitcoin, FaEthereum } from "react-icons/fa";
import { BsGraphUp, BsCurrencyExchange, BsFillCircleFill } from "react-icons/bs";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

const API = "https://api.coingecko.com/api/v3";

export default function App() {
  const [coins, setCoins] = useState([]);
  const [selected, setSelected] = useState(null);
  const [chart, setChart] = useState([]);
  const [currency, setCurrency] = useState("usd");
  const [amount, setAmount] = useState("");
  const [alertPrice, setAlertPrice] = useState("");
  const [alertCondition, setAlertCondition] = useState("above");
  const [favorites, setFavorites] = useState([]);
  const [sortBy, setSortBy] = useState("market_cap");
  const [search, setSearch] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [portfolio, setPortfolio] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showCoinDetails, setShowCoinDetails] = useState(false);
  const [editingPortfolioItem, setEditingPortfolioItem] = useState(null);
  const [editAmount, setEditAmount] = useState("");

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem('cryptoFavorites')) || [];
    const savedAlerts = JSON.parse(localStorage.getItem('cryptoAlerts')) || [];
    const savedPortfolio = JSON.parse(localStorage.getItem('cryptoPortfolio')) || {};
    setFavorites(savedFavorites);
    setAlerts(savedAlerts);
    setPortfolio(savedPortfolio);
  }, []);

  // Fetch coins data
  useEffect(() => {
    setLoading(true);
    fetch(`${API}/coins/markets?vs_currency=${currency}&order=${sortBy}_desc&per_page=20&page=1`)
      .then(res => res.json())
      .then(data => {
        setCoins(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currency, sortBy]);

  // Check alerts when coins update
  useEffect(() => {
    if (coins.length === 0 || alerts.length === 0) return;

    const updatedAlerts = alerts.map(alert => {
      const coin = coins.find(c => c.id === alert.coinId);
      if (!coin) return alert;

      const shouldTrigger = alert.condition === "above"
        ? coin.current_price >= alert.targetPrice
        : coin.current_price <= alert.targetPrice;

      if (shouldTrigger && alert.status === "active") {
        // Trigger notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(
            `🚨 Alert Triggered!`,
            {
              body: `${alert.coinName} ${alert.condition === "above" ? "rose above" : "fell below"} ${currency === 'usd' ? '$' : '₨'}${alert.targetPrice}`,
              icon: coin.image
            }
          );
        }

        return { ...alert, status: "triggered", triggeredAt: new Date().toISOString() };
      }
      return alert;
    });

    // Only update if alerts changed
    if (JSON.stringify(updatedAlerts) !== JSON.stringify(alerts)) {
      setAlerts(updatedAlerts);
      localStorage.setItem('cryptoAlerts', JSON.stringify(updatedAlerts));
    }
  }, [coins, alerts, currency]);

  // Filter coins based on search
  const filteredCoins = useMemo(() => {
    return coins.filter(coin =>
      coin.name.toLowerCase().includes(search.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(search.toLowerCase())
    );
  }, [coins, search]);

  const loadChart = async (coin) => {
    setSelected(coin);
    const res = await fetch(`${API}/coins/${coin.id}/market_chart?vs_currency=${currency}&days=7`);
    const data = await res.json();
    setChart(data.prices);
    setShowCoinDetails(true);
  };

  const toggleFavorite = (coinId) => {
    const updatedFavorites = favorites.includes(coinId)
      ? favorites.filter(id => id !== coinId)
      : [...favorites, coinId];
    setFavorites(updatedFavorites);
    localStorage.setItem('cryptoFavorites', JSON.stringify(updatedFavorites));
  };

  const addAlert = () => {
    if (!selected || !alertPrice) return;

    const newAlert = {
      id: Date.now(),
      coinId: selected.id,
      coinName: selected.name,
      coinSymbol: selected.symbol,
      image: selected.image,
      currentPrice: selected.current_price,
      targetPrice: parseFloat(alertPrice),
      condition: alertCondition,
      currency,
      status: "active",
      createdAt: new Date().toISOString()
    };

    const updatedAlerts = [...alerts, newAlert];
    setAlerts(updatedAlerts);
    localStorage.setItem('cryptoAlerts', JSON.stringify(updatedAlerts));

    setAlertPrice("");
    setAlertCondition("above");
  };

  const removeAlert = (alertId) => {
    const updatedAlerts = alerts.filter(alert => alert.id !== alertId);
    setAlerts(updatedAlerts);
    localStorage.setItem('cryptoAlerts', JSON.stringify(updatedAlerts));
  };

  const addToPortfolio = () => {
    if (!selected || !amount) return;

    const updatedPortfolio = {
      ...portfolio,
      [selected.id]: {
        coinId: selected.id,
        coinName: selected.name,
        coinSymbol: selected.symbol,
        image: selected.image,
        amount: parseFloat(amount),
        purchasePrice: selected.current_price,
        purchaseDate: new Date().toISOString(),
        currency
      }
    };

    setPortfolio(updatedPortfolio);
    localStorage.setItem('cryptoPortfolio', JSON.stringify(updatedPortfolio));
    setAmount("");
  };

  const removeFromPortfolio = (coinId) => {
    const updatedPortfolio = { ...portfolio };
    delete updatedPortfolio[coinId];
    setPortfolio(updatedPortfolio);
    localStorage.setItem('cryptoPortfolio', JSON.stringify(updatedPortfolio));
  };

  const updatePortfolioAmount = (coinId) => {
    if (!editAmount || parseFloat(editAmount) <= 0) return;

    const updatedPortfolio = {
      ...portfolio,
      [coinId]: {
        ...portfolio[coinId],
        amount: parseFloat(editAmount)
      }
    };

    setPortfolio(updatedPortfolio);
    localStorage.setItem('cryptoPortfolio', JSON.stringify(updatedPortfolio));
    setEditingPortfolioItem(null);
    setEditAmount("");
  };

  // Calculate total portfolio value
  const portfolioValue = useMemo(() => {
    return Object.values(portfolio).reduce((total, item) => {
      const coin = coins.find(c => c.id === item.coinId);
      if (coin) {
        return total + (item.amount * coin.current_price);
      }
      return total;
    }, 0);
  }, [portfolio, coins]);

  // Calculate total invested amount
  const totalInvested = useMemo(() => {
    return Object.values(portfolio).reduce((total, item) => {
      return total + (item.amount * item.purchasePrice);
    }, 0);
  }, [portfolio]);

  // Calculate total profit/loss
  const totalProfitLoss = portfolioValue - totalInvested;
  const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  // Calculate portfolio breakdown
  const portfolioBreakdown = useMemo(() => {
    return Object.values(portfolio).map(item => {
      const coin = coins.find(c => c.id === item.coinId);
      const currentValue = coin ? item.amount * coin.current_price : 0;
      const profitLoss = currentValue - (item.amount * item.purchasePrice);
      const profitLossPercent = ((profitLoss / (item.amount * item.purchasePrice)) * 100);
      const weight = portfolioValue > 0 ? (currentValue / portfolioValue) * 100 : 0;

      return {
        ...item,
        currentPrice: coin ? coin.current_price : 0,
        currentValue,
        profitLoss,
        profitLossPercent,
        weight
      };
    }).sort((a, b) => b.currentValue - a.currentValue);
  }, [portfolio, coins, portfolioValue]);

  const chartData = {
    labels: chart.map(p => new Date(p[0]).toLocaleDateString()),
    datasets: [
      {
        label: "Price",
        data: chart.map(p => p[1]),
        borderWidth: 2,
        tension: 0.4,
        borderColor: selected?.price_change_percentage_24h >= 0 ? "#10b981" : "#ef4444",
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        pointBackgroundColor: selected?.price_change_percentage_24h >= 0 ? "#10b981" : "#ef4444",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(229, 231, 235, 0.2)'
        },
        ticks: {
          color: '#6b7280'
        }
      },
      y: {
        grid: {
          color: 'rgba(229, 231, 235, 0.2)'
        },
        ticks: {
          color: '#6b7280',
          callback: function (value) {
            return currency === 'usd' ? '$' + value.toFixed(2) : '₨' + value.toFixed(0);
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  const requestNotificationPermission = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  return (
    <div className="app">
      <div className="header-wrapper">
        <header>
          <div className="header-left">
            <div className="logo">
              <span className="logo-icon">
                <FiTrendingUp className="logo-icon-svg" />
              </span>
              <h1>
                <BsGraphUp className="title-icon" />
                FinTech Crypto
              </h1>
            </div>
            <p className="tagline">
              <FiGlobe className="tagline-icon" />
              Real-time cryptocurrency market dashboard
            </p>
          </div>

          <div className="header-right">
            <div className="currency-selector">
              <button
                className={`currency-btn ${currency === 'usd' ? 'active' : ''}`}
                onClick={() => setCurrency('usd')}
              >
                <FiDollarSign className="currency-icon" />
                USD
              </button>
              <button
                className={`currency-btn ${currency === 'pkr' ? 'active' : ''}`}
                onClick={() => setCurrency('pkr')}
              >
                <BsCurrencyExchange className="currency-icon" />
                PKR
              </button>
            </div>

            <div className="portfolio-summary">
              <span className="portfolio-label">
                <FiBriefcase className="portfolio-icon" />
                Portfolio Value
              </span>
              <span className="portfolio-value">
                {currency === 'usd' ? '$' : '₨'} {portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </header>

        <nav className="tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('overview');
              setShowCoinDetails(false);
              setSelected(null);
            }}
          >
            <FiBarChart2 className="tab-icon" />
            Market Overview
          </button>
          <button
            className={`tab ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('portfolio');
              setShowCoinDetails(false);
              setSelected(null);
            }}
          >
            <FiBriefcase className="tab-icon" />
            Portfolio
          </button>
          <button
            className={`tab ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('alerts');
              setShowCoinDetails(false);
              setSelected(null);
            }}
          >
            <FiBell className="tab-icon" />
            Alerts ({alerts.length})
          </button>
          <button
            className={`tab ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('favorites');
              setShowCoinDetails(false);
              setSelected(null);
            }}
          >
            <FiStar className="tab-icon" />
            Favorites ({favorites.length})
          </button>
        </nav>
      </div>

      <div className="main-content">
        {activeTab === 'overview' && (
          <>
            <div className="controls-bar">
              <div className="search-container">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search cryptocurrencies..."
                  className="search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="sort-container">
                <select
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="market_cap">Market Cap</option>
                  <option value="volume">Volume</option>
                  <option value="price_change_percentage_24h">24h Change</option>
                </select>
              </div>
            </div>

            <div className="stats-summary">
              <div className="stat-card">
                <span className="stat-label">
                  <FiGlobe className="stat-icon" />
                  Total Coins
                </span>
                <span className="stat-value">{coins.length}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">
                  <FiPieChart className="stat-icon" />
                  Market Dominance
                </span>
                <span className="stat-value">
                  {coins.length > 0 ? ((coins[0]?.market_cap / coins.reduce((sum, coin) => sum + coin.market_cap, 0)) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">
                  <FiTrendingUp className="stat-icon" />
                  24h Volume
                </span>
                <span className="stat-value">
                  {currency === 'usd' ? '$' : '₨'}
                  {coins.length > 0 ? (coins.reduce((sum, coin) => sum + coin.total_volume, 0) / 1000000000).toFixed(2) : 0}B
                </span>
              </div>
            </div>

            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Loading market data...</p>
              </div>
            ) : showCoinDetails && selected ? (
              <div className="coin-details-view">
                <div className="details-header">
                  <button
                    className="back-button"
                    onClick={() => {
                      setShowCoinDetails(false);
                      setSelected(null);
                    }}
                  >
                    <FiChevronRight className="back-icon" />
                    Back to Market
                  </button>
                  <div className="selected-coin-header">
                    <img src={selected.image} alt={selected.name} className="selected-coin-icon" />
                    <div className="selected-coin-info">
                      <h2>{selected.name} ({selected.symbol.toUpperCase()})</h2>
                      <div className="selected-price">
                        <span className="current">
                          {currency === 'usd' ? '$' : '₨'} {selected.current_price.toLocaleString()}
                        </span>
                        <span className={`selected-change ${selected.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
                          {selected.price_change_percentage_24h >= 0 ? <FiArrowUp /> : <FiArrowDown />}
                          {Math.abs(selected.price_change_percentage_24h).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="chart-container">
                  <Line data={chartData} options={chartOptions} />
                </div>

                <div className="tools-grid">
                  <div className="tool-card">
                    <div className="tool-header">
                      <span className="tool-icon">
                        <FiBarChart2 />
                      </span>
                      <h3>Coin Details</h3>
                    </div>
                    <div className="details-list">
                      <div className="detail-item">
                        <span className="detail-label">Market Cap</span>
                        <span className="detail-value">
                          {currency === 'usd' ? '$' : '₨'} {(selected.market_cap / 1000000000).toFixed(2)}B
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">24h Volume</span>
                        <span className="detail-value">
                          {currency === 'usd' ? '$' : '₨'} {(selected.total_volume / 1000000).toFixed(2)}M
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">24h High</span>
                        <span className="detail-value">
                          {currency === 'usd' ? '$' : '₨'} {selected.high_24h}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">24h Low</span>
                        <span className="detail-value">
                          {currency === 'usd' ? '$' : '₨'} {selected.low_24h}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Circulating Supply</span>
                        <span className="detail-value">
                          {(selected.circulating_supply / 1000000).toFixed(2)}M
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Total Supply</span>
                        <span className="detail-value">
                          {selected.total_supply ? (selected.total_supply / 1000000).toFixed(2) + 'M' : '∞'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="coins-grid">
                {filteredCoins.map(coin => (
                  <div
                    className={`coin-card ${favorites.includes(coin.id) ? 'favorite' : ''}`}
                    key={coin.id}
                    onClick={() => loadChart(coin)}
                  >
                    <div className="coin-card-header">
                      <img src={coin.image} alt={coin.name} className="coin-icon" />
                      <div className="coin-info">
                        <h3 className="coin-name">{coin.name}</h3>
                        <span className="coin-symbol">{coin.symbol.toUpperCase()}</span>
                      </div>
                      <button
                        className={`fav-btn ${favorites.includes(coin.id) ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(coin.id);
                        }}
                      >
                        <FiStar />
                      </button>
                    </div>

                    <div className="coin-price">
                      <span className="price">
                        {currency === 'usd' ? '$' : '₨'} {coin.current_price.toLocaleString()}
                      </span>
                      <span className={`change ${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
                        {coin.price_change_percentage_24h >= 0 ? <FiArrowUp /> : <FiArrowDown />}
                        {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                      </span>
                    </div>

                    <div className="coin-stats">
                      <div className="stat">
                        <span className="stat-label">Market Cap</span>
                        <span className="stat-value">
                          {currency === 'usd' ? '$' : '₨'} {(coin.market_cap / 1000000000).toFixed(2)}B
                        </span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">24h Volume</span>
                        <span className="stat-value">
                          {currency === 'usd' ? '$' : '₨'} {(coin.total_volume / 1000000).toFixed(2)}M
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'portfolio' && (
          <div className="portfolio-container">

{/* Portfolio Summary Cards at the top */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
  {/* Total Value */}
  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col">
    <span className="flex items-center text-gray-500 dark:text-gray-300 font-medium mb-2">
      <FiDollar className="mr-2 text-xl" />
      Total Value
    </span>
    <span className="text-2xl font-bold text-gray-900 dark:text-white">
      {currency === 'usd' ? '$' : '₨'} {portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  </div>

  {/* Total Invested */}
  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col">
    <span className="flex items-center text-gray-500 dark:text-gray-300 font-medium mb-2">
      <FiTrendingUp className="mr-2 text-xl" />
      Total Invested
    </span>
    <span className="text-2xl font-bold text-gray-900 dark:text-white">
      {currency === 'usd' ? '$' : '₨'} {totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  </div>

  {/* Profit/Loss */}
  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col">
    <span className="flex items-center text-gray-500 dark:text-gray-300 font-medium mb-2">
      <FiPercent className="mr-2 text-xl" />
      Profit/Loss
    </span>
    <span className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
      {currency === 'usd' ? '$' : '₨'} {Math.abs(totalProfitLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
        ({totalProfitLossPercent.toFixed(2)}%)
      </span>
    </span>
  </div>
</div>

            {/* Add to Portfolio Form */}
            <div className="add-portfolio-form">
              <h3><FiPlus className="form-icon" /> Add to Portfolio</h3>

              <div className="form-row">
                {/* Coin selector */}
                <div className="form-group">
                  <label>Select Coin</label>
                  <select
                    value={selected?.id || ""}
                    onChange={(e) => {
                      const coin = coins.find(c => c.id === e.target.value);
                      setSelected(coin);
                    }}
                  >
                    <option value="">-- Select Coin --</option>
                    {coins.map((coin) => (
                      <option key={coin.id} value={coin.id}>
                        {coin.name} ({coin.symbol.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* If a coin is selected, show image & info */}
                {selected && (
                  <div className="form-group">
                    <label>Selected Coin</label>
                    <div className="selected-coin-display">
                      <img src={selected.image} alt={selected.name} />
                      <div>
                        <strong>{selected.name}</strong>
                        <span>{selected.symbol.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Amount</label>
                  <div className="input-with-suffix">
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="0"
                      step="0.0001"
                    />
                    <span className="input-suffix">{selected?.symbol?.toUpperCase() || ""}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Estimated Value</label>
                  <div className="estimated-value">
                    {currency === 'usd' ? '$' : '₨'} {(amount * (selected?.current_price || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="form-group">
                  <button
                    className="add-btn"
                    onClick={addToPortfolio}
                    disabled={!amount || !selected}
                  >
                    <FiPlus /> Add to Portfolio
                  </button>
                </div>
              </div>
            </div>

            {/* Portfolio Table */}
            {portfolioBreakdown.length > 0 ? (
              <div className="portfolio-table-container">
                <table className="portfolio-table">
                  <thead>
                    <tr>
                      <th>Coin</th>
                      <th>Amount</th>
                      <th>Purchase Price</th>
                      <th>Current Price</th>
                      <th>Current Value</th>
                      <th>P/L %</th>
                      <th>Weight</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioBreakdown.map((item) => (
                      <tr key={item.coinId}>
                        <td>
                          <div className="coin-cell">
                            <img src={item.image} alt={item.coinName} />
                            <div>
                              <strong>{item.coinName}</strong>
                              <span>{item.coinSymbol.toUpperCase()}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          {editingPortfolioItem === item.coinId ? (
                            <div className="edit-amount">
                              <input
                                type="number"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                min="0"
                                step="0.0001"
                              />
                              <button
                                className="save-btn"
                                onClick={() => updatePortfolioAmount(item.coinId)}
                              >
                                <FiCheck />
                              </button>
                            </div>
                          ) : (
                            <strong>{item.amount}</strong>
                          )}
                        </td>
                        <td>
                          {currency === 'usd' ? '$' : '₨'} {item.purchasePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          {currency === 'usd' ? '$' : '₨'} {item.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          <strong>
                            {currency === 'usd' ? '$' : '₨'} {item.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </strong>
                        </td>
                        <td>
                          <span className={`pl-badge ${item.profitLossPercent >= 0 ? 'positive' : 'negative'}`}>
                            {item.profitLossPercent >= 0 ? <FiArrowUp /> : <FiArrowDown />}
                            {Math.abs(item.profitLossPercent).toFixed(2)}%
                          </span>
                        </td>
                        <td>
                          <div className="weight-cell">
                            <div className="weight-bar">
                              <div
                                className="weight-fill"
                                style={{ width: `${item.weight}%` }}
                              ></div>
                            </div>
                            <span>{item.weight.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="edit-btn"
                              onClick={() => {
                                setEditingPortfolioItem(item.coinId);
                                setEditAmount(item.amount.toString());
                              }}
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              className="remove-btn"
                              onClick={() => removeFromPortfolio(item.coinId)}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <FiBriefcase />
                </div>
                <h3>No assets in portfolio</h3>
                <p>Select a coin from market overview and enter amount to add to portfolio</p>
              </div>
            )}
          </div>
        )}


        {activeTab === 'alerts' && (
          <div className="alerts-container">
            <div className="alerts-header">
              <h2><FiBell className="section-icon" /> Price Alerts</h2>
              <button className="notification-btn" onClick={requestNotificationPermission}>
                <FiBell />
                Enable Notifications
              </button>
            </div>

            {/* Set Alert Form */}
            <div className="set-alert-form">
              <h3><FiPlus className="form-icon" /> Set New Alert</h3>
              <div className="form-row">
                {/* Coin selector */}
                <div className="form-group">
                  <label>Select Coin</label>
                  <select
                    value={selected?.id || ""}
                    onChange={(e) => {
                      const coin = coins.find(c => c.id === e.target.value);
                      setSelected(coin);
                    }}
                  >
                    <option value="">-- Select Coin --</option>
                    {coins.map((coin) => (
                      <option key={coin.id} value={coin.id}>
                        {coin.name} ({coin.symbol.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Only show alert details if coin is selected */}
                {selected && (
                  <>
                    <div className="form-group">
                      <label>Condition</label>
                      <div className="condition-selector">
                        <button
                          className={`condition-btn ${alertCondition === 'above' ? 'active' : ''}`}
                          onClick={() => setAlertCondition('above')}
                        >
                          <FiArrowUp /> Price Rises Above
                        </button>
                        <button
                          className={`condition-btn ${alertCondition === 'below' ? 'active' : ''}`}
                          onClick={() => setAlertCondition('below')}
                        >
                          <FiArrowDown /> Price Falls Below
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Target Price</label>
                      <div className="input-with-suffix">
                        <input
                          type="number"
                          placeholder="Enter target price"
                          value={alertPrice}
                          onChange={(e) => setAlertPrice(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                        <span className="input-suffix">{currency.toUpperCase()}</span>
                      </div>
                      <div className="current-price">
                        Current: {currency === 'usd' ? '$' : '₨'} {selected.current_price}
                      </div>
                    </div>

                    <div className="form-group">
                      <button
                        className="set-alert-btn"
                        onClick={addAlert}
                        disabled={!alertPrice || !selected}
                      >
                        <FiBell /> Set Alert
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* Alerts Table */}
            {alerts.length > 0 ? (
              <div className="alerts-table-container">
                <table className="alerts-table">
                  <thead>
                    <tr>
                      <th>Coin</th>
                      <th>Condition</th>
                      <th>Target Price</th>
                      <th>Current Price</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((alert) => {
                      const coin = coins.find(c => c.id === alert.coinId);
                      const currentPrice = coin ? coin.current_price : alert.currentPrice;
                      const isClose = Math.abs(currentPrice - alert.targetPrice) / alert.targetPrice < 0.02;

                      return (
                        <tr key={alert.id} className={isClose ? 'alert-close' : ''}>
                          <td>
                            <div className="coin-cell">
                              <img src={alert.image} alt={alert.coinName} />
                              <div>
                                <strong>{alert.coinName}</strong>
                                <span>{alert.coinSymbol.toUpperCase()}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`condition-badge ${alert.condition}`}>
                              {alert.condition === 'above' ? <FiArrowUp /> : <FiArrowDown />}
                              {alert.condition === 'above' ? 'Above' : 'Below'}
                            </span>
                          </td>
                          <td>
                            <strong>
                              {currency === 'usd' ? '$' : '₨'} {alert.targetPrice}
                            </strong>
                          </td>
                          <td>
                            {currency === 'usd' ? '$' : '₨'} {currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td>
                            <span className={`status-badge ${alert.status}`}>
                              <BsFillCircleFill />
                              {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                            </span>
                          </td>
                          <td>
                            {new Date(alert.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <button
                              className="remove-alert-btn"
                              onClick={() => removeAlert(alert.id)}
                            >
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <FiBell />
                </div>
                <h3>No alerts set</h3>
                <p>Set price alerts to get notified when coins reach your target price</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="favorites-container">
            <h2><FiStar className="section-icon" /> Favorite Coins</h2>
            {favorites.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <FiStar />
                </div>
                <h3>No favorites yet</h3>
                <p>Click the star icon on any coin card to add it to favorites</p>
              </div>
            ) : (
              <div className="coins-grid">
                {coins
                  .filter(coin => favorites.includes(coin.id))
                  .map(coin => (
                    <div
                      className="coin-card favorite"
                      key={coin.id}
                      onClick={() => loadChart(coin)}
                    >
                      <div className="coin-card-header">
                        <img src={coin.image} alt={coin.name} className="coin-icon" />
                        <div className="coin-info">
                          <h3 className="coin-name">{coin.name}</h3>
                          <span className="coin-symbol">{coin.symbol.toUpperCase()}</span>
                        </div>
                        <button
                          className="fav-btn active"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(coin.id);
                          }}
                        >
                          <FiStar />
                        </button>
                      </div>
                      <div className="coin-price">
                        <span className="price">
                          {currency === 'usd' ? '$' : '₨'} {coin.current_price.toLocaleString()}
                        </span>
                        <span className={`change ${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
                          {coin.price_change_percentage_24h >= 0 ? <FiArrowUp /> : <FiArrowDown />}
                          {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                        </span>
                      </div>
                      <div className="coin-stats">
                        <div className="stat">
                          <span className="stat-label">Market Cap</span>
                          <span className="stat-value">
                            {currency === 'usd' ? '$' : '₨'} {(coin.market_cap / 1000000000).toFixed(2)}B
                          </span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">24h Volume</span>
                          <span className="stat-value">
                            {currency === 'usd' ? '$' : '₨'} {(coin.total_volume / 1000000).toFixed(2)}M
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        )}
      </div>

      <footer>
        <p>
          <FiGlobe className="footer-icon" />
          Powered by CoinGecko API • Data updates in real-time
        </p>
        <p className="footer-links">
          <span><FiRefreshCw className="footer-icon" /> FinTech Crypto Dashboard</span>
          <span>•</span>
          <span>Updated just now</span>
        </p>
      </footer>
    </div>
  );
}
