import { useEffect, useState } from "react";
import Chart from "./Chart";

function CryptoCards() {
  const [coins, setCoins] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [prices, setPrices] = useState([]);
  const [favorites, setFavorites] = useState(
    JSON.parse(localStorage.getItem("fav")) || []
  );

  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=20")
      .then(res => res.json())
      .then(data => setCoins(data));
  }, []);

  const loadChart = async (id) => {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`
    );
    const data = await res.json();
    setPrices(data.prices.map(p => p[1]));
    setSelected(id);
  };

  const toggleFav = (coin) => {
    let updated;
    if (favorites.includes(coin)) {
      updated = favorites.filter(f => f !== coin);
    } else {
      updated = [...favorites, coin];
    }
    setFavorites(updated);
    localStorage.setItem("fav", JSON.stringify(updated));
  };

  return (
    <>
      <input
        className="search"
        placeholder="Search coin..."
        onChange={e => setSearch(e.target.value)}
      />

      <div className="grid">
        {coins.filter(c =>
          c.name.toLowerCase().includes(search.toLowerCase())
        ).map(coin => (
          <div className="card" key={coin.id} onClick={() => loadChart(coin.id)}>
            <img src={coin.image} />
            <h3>{coin.name}</h3>
            <p>${coin.current_price}</p>
            <span className={coin.price_change_percentage_24h >= 0 ? "green" : "red"}>
              {coin.price_change_percentage_24h.toFixed(2)}%
            </span>

            <button
              className="fav"
              onClick={(e) => {
                e.stopPropagation();
                toggleFav(coin.name);
              }}
            >
              {favorites.includes(coin.name) ? "★" : "☆"}
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <div className="chart-box">
          <h3>7 Day Price Chart</h3>
          <Chart prices={prices} />
        </div>
      )}
    </>
  );
}

export default CryptoCards;

