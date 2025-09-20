// frontend/src/components/CryptoDashboard/Footer/Footer.jsx
import React from "react";
import styles from "../../../style";
import "./Footer.css";

function Footer() {
  return (
    <div className={`footer ${styles.flexCenter} text-white py-4 border-t border-gray-600`}>
      <p className={`${styles.paragraph} text-[13px]`}>
        Copyright @2024, Crypto Price Tracker - All Rights Reserved
      </p>
    </div>
  );
}

export default Footer;