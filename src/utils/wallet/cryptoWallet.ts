const addCryptoInWallet = (id: any) => {
  const payload = {
    accounts: [
      {
        currency: "BTC",
        xpub: "tpubDF5Dv9pHaYsE5nUvuxTkbCy4CHd19Ma3vFHcXxwQS1q2SyZYaPDQwGmi8PaeDLAnUfJnLFvEuZ764EbKbZV3a2mxAvbKBWdEtjpPzKmx9Cd",
        customer: {
          accountingCurrency: "INR",
          customerCountry: "IN",
          externalId: id,
          providerCountry: "IN",
        },
        accountingCurrency: "INR",
      },
      {
        currency: "ETH",
        xpub: "xpub6Eg9DE9Zw3jgHEYxMXc5mHnLtzCgW7ZBRwtZ3HpdS2jh9h2q5zsCRrahFWTEFftnTGaFyvYX8amWk53zDGLX7F5FUtQBF2FaUxo166oLz4c",
        customer: {
          accountingCurrency: "INR",
          customerCountry: "IN",
          externalId: id,
          providerCountry: "IN",
        },
        accountingCurrency: "INR",
      },
      {
        currency: "TRON",
        xpub: "03327e9df27ed20ffa2aea3890269cf6b2691fd8177851ef9d3609489a28c1bf56cbe95cd2106c57858ccc3ad7cd8878bd33352d6b6a792382e6c0ced6cf7f1a13",
        customer: {
          accountingCurrency: "INR",
          customerCountry: "IN",
          externalId: id,
          providerCountry: "IN",
        },
        accountingCurrency: "INR",
      },
      {
        currency: "DOGE",
        xpub: "tpubDEAWFNxCotqcXruQDnrH9KcHVCFKFe1bPQ1cPH1QgyWFaEGYaq1CDaVrCz7z2XVkCA68DALZvaLE9knkbbyYfLBGfXb3tMuyDcjArNYcRCb",
        customer: {
          accountingCurrency: "INR",
          customerCountry: "IN",
          externalId: id,
          providerCountry: "IN",
        },
        accountingCurrency: "INR",
      },
      {
        currency: "XRP",
        xpub: "rKqtzViTodWUdgnij3K1D7dUnHn4XeGrjC",
        customer: {
          accountingCurrency: "INR",
          customerCountry: "IN",
          externalId: id,
          providerCountry: "IN",
        },
        accountingCurrency: "INR",
      },
      {
        currency: "XLM",
        xpub: "GCICE6PFKJER7IA5ME44TZGQJERC3YWGTQAOHZ464QMPDJRX35NN6NYV",
        customer: {
          accountingCurrency: "INR",
          customerCountry: "IN",
          externalId: id,
          providerCountry: "IN",
        },
        accountingCurrency: "INR",
      },
      {
        currency: "SOL",
        privateKey:
          "2csxJ5JCGivNwo1dSRNXyMEbF3oRGY3B3HfsAdtmHQUddS4M3N5JjJvfvpCXnLPj5EpW14a75RGbvFkKtga6cS1K",
        customer: {
          accountingCurrency: "INR",
          customerCountry: "IN",
          externalId: id,
          providerCountry: "IN",
        },
        accountingCurrency: "INR",
      },
      {
        currency: "VC_INR3",
        customer: {
          accountingCurrency: "INR",
          customerCountry: "IN",
          externalId: id,
          providerCountry: "IN",
        },
        accountingCurrency: "INR",
      },
      {
        currency: "MATIC",
        xpub: "xpub6Ec28xHs6X1gbWHxvxfQQEJq7h2MhzVaBwcGwsgfwRTMczxhLonBqkoCNTNtxbzS4XDSQSD56Zq8EiqLkRpA2UKv9sp3T2cfm5raiL17HAN",
        customer: {
          accountingCurrency: "INR",
          customerCountry: "IN",
          externalId: id,
          providerCountry: "IN",
        },
      },
    ],
  };

  return payload;
};

export { addCryptoInWallet };
