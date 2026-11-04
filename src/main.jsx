
import React from "react";
import ReactDOM from "react-dom/client";

import { BrowserRouter } from "react-router";

import App from "./App.jsx";

import {
  ReceitaCompartilhada,
} from "./components/CompartilharReceita.jsx";

import "./index.css";

// Detecta os links públicos de compartilhamento.
const parametros = new URLSearchParams(
  window.location.search
);

const tokenCompartilhamento =
  parametros.get("compartilhar");

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    {tokenCompartilhamento ? (
      // O visitante visualiza apenas a receita compartilhada.
      <ReceitaCompartilhada
        token={tokenCompartilhamento}
      />
    ) : (
      // As páginas internas utilizam React Router.
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )}
  </React.StrictMode>
);
