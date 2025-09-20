import React, { useContext } from "react";
import "./Navbar.css";
import logoC from "../../CryptoDashboard/logoC.png";
import arrow_icon from "../../../assets/arrow_icon.png"; // Adjust path if needed
import { CoinContext } from "../../../context/CoinContext";
import { Link } from "react-router-dom";
import styles from "../../../style";

function Navbar() {
  const { setCurrency } = useContext(CoinContext);

  const currencyHandler = (event) => {
    switch (event.target.value) {
      case "usd": {
        setCurrency({ name: "usd", Symbol: "$" });
        break;
      }
      case "euro": {
        setCurrency({ name: "eur", Symbol: "€" });
        break;
      }
      case "inr": {
        setCurrency({ name: "inr", Symbol: "₹" });
        break;
      }
      default: {
        setCurrency({ name: "usd", Symbol: "$" });
        break;
      }
    }
  };

  return (
    <div className="navbar">
      <Link to="/dashboard/crypto">
        <img src={logoC} alt="cryptoLogo" className="logo" />
      </Link>
      <ul>
        <Link to="/dashboard/crypto">
          <li>Home</li>
        </Link>
        <Link to="/business">
        <li>Features</li>
        </Link>
        <li>Pricing</li>
        <li>Blog</li>
      </ul>
      <div className="nav-right">
        <select onChange={currencyHandler} className="text-white bg-dimBlue border border-white rounded p-2">
          <option value="usd">USD</option>
          <option value="euro">EURO</option>
          <option value="inr">INR</option>
        </select>
        <button className={`${styles.flexCenter} bg-blue-gradient text-primary font-poppins font-medium py-2 px-4 rounded-full`}>
          Sign Up <img src={arrow_icon} alt="arrow-icon" />
        </button>
      </div>
    </div>
  );
}

export default Navbar;