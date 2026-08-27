// Panel del navegador: estado en memoria, render por plantillas y fetch.
//
// Sin framework y sin build. Es una decision de producto, no una limitacion:
// esta aplicacion sirve su propio panel desde un proceso local, y anadir una
// cadena de compilacion significaria anadir arbol de dependencias -justo lo que
// `scripts/check-local-only.js` tumba en cada build-.
//
// Dos cosas que no se pueden relajar al tocar este archivo:
//
//   - TODO lo que llega del servidor pasa por `escapeHtml` antes de ir al DOM,
//     y toda URL de aviso por `safeUrl`, que solo deja pasar http y https;
//   - toda mutacion manda la cabecera `x-rootcause-request: 1`, que es la
//     comprobacion de origen local del servidor. Sin ella, 403.
//
// La CSP servida prohibe scripts inline, asi que nada de este panel puede
// ejecutarse desde un atributo del HTML.
const state = {
  summary: null,
  advisories: [],
  activeView: "dashboard"
};

const pageTitles = {
  dashboard: "Panorama de riesgo",
  custody: "Custodia y firmantes",
  incidents: "Respuesta a incidentes",
  intelligence: "Inteligencia verificada",
  laboratory: "Laboratorio seguro"
};

function element(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return entities[character];
  });
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "#";
  } catch {
    return "#";
  }
}

function formatBtc(sats) {
  return (Number(sats || 0) / 100000000).toLocaleString("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8
  });
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function severityLabel(value) {
  return {
    critical: "Crítico",
    high: "Alto",
    medium: "Medio",
    low: "Bajo",
    info: "Info"
  }[value] || value;
}

function statusLabel(value) {
  return {
    open: "Abierto",
    acknowledged: "Reconocido",
    resolved: "Resuelto"
  }[value] || value;
}

async function api(path, options = {}) {
  const mutation = options.method && options.method !== "GET";
  const headers = {
    accept: "application/json",
    ...(options.headers || {})
  };
  if (mutation) {
    headers["content-type"] = "application/json";
    headers["x-rootcause-request"] = "1";
  }
  const response = await fetch(path, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || "La operación no pudo completarse.");
  }
  return payload;
}

let toastTimer;
function toast(message, kind = "success") {
  const target = element("toast");
  target.textContent = message;
  target.className = "toast visible" + (kind === "error" ? " error" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    target.className = "toast";
  }, 4200);
}

function setBusy(button, busy, busyLabel) {
  if (!button) return;
  if (busy) {
    button.dataset.originalLabel = button.textContent;
    button.textContent = busyLabel;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalLabel || button.textContent;
    button.disabled = false;
  }
}

function switchView(view) {
  if (!pageTitles[view]) return;
  state.activeView = view;
  document.querySelectorAll(".view").forEach((node) => {
    node.classList.toggle("active", node.dataset.view === view);
  });
  document.querySelectorAll(".nav-item").forEach((node) => {
    node.classList.toggle("active", node.dataset.viewTarget === view);
  });
  element("page-title").textContent = pageTitles[view];
  document.body.classList.remove("menu-open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function riskExplanation(level) {
  return {
    critical:
      "Existe una condición capaz de comprometer fondos. Contén autorizaciones y ejecuta el runbook.",
    high:
      "La arquitectura tiene debilidades relevantes que requieren corrección prioritaria.",
    medium:
      "Hay trazabilidad o controles incompletos. Corrige antes de aumentar la exposición.",
    low: "La exposición actual es acotada, pero todavía existen mejoras pendientes.",
    clear: "No se detectan hallazgos activos con las reglas instaladas."
  }[level];
}

function renderDashboard() {
  const summary = state.summary;
  if (!summary) return;
  const risk = summary.risk;
  element("risk-score").textContent = risk.score;
  element("risk-ring").style.setProperty("--score", risk.score);
  element("risk-explanation").textContent = riskExplanation(risk.level);
  element("mode-badge").textContent =
    summary.mode === "demo" ? "Modo demostración" : "Persistencia cifrada";
  element("metric-wallets").textContent = summary.totals.wallets;
  element("metric-signers").textContent = summary.totals.signers + " firmantes";
  element("metric-incidents").textContent = summary.totals.activeIncidents;
  element("metric-critical").textContent =
    summary.risk.counts.critical + " críticos";
  element("metric-btc").textContent = formatBtc(summary.totals.watchedSats) + " BTC";

  const node = summary.node;
  element("metric-node").textContent = node?.connected ? "Conectado" : "Sin conexión";
  element("metric-node-detail").textContent = node?.connected
    ? "bloque " + Number(node.blocks || 0).toLocaleString("es-CL")
    : node?.error || "No configurado";

  renderDashboardIncidents();
  renderNode();
}

function renderDashboardIncidents() {
  const target = element("dashboard-incidents");
  const incidents = (state.summary?.incidents || [])
    .filter((incident) => ["open", "acknowledged"].includes(incident.status))
    .slice(0, 5);
  target.classList.remove("skeleton");
  if (!incidents.length) {
    target.innerHTML =
      '<div class="empty-state">No hay incidentes activos con las reglas instaladas.</div>';
    return;
  }
  target.innerHTML = incidents
    .map(
      (incident) =>
        '<div class="incident-item">' +
        '<span class="severity-bar ' +
        escapeHtml(incident.severity) +
        '"></span>' +
        "<div><strong>" +
        escapeHtml(incident.title) +
        "</strong><small>" +
        escapeHtml(incident.code) +
        " · " +
        escapeHtml(formatDate(incident.lastSeenAt)) +
        "</small></div>" +
        '<span class="severity-chip ' +
        escapeHtml(incident.severity) +
        '">' +
        escapeHtml(severityLabel(incident.severity)) +
        "</span></div>"
    )
    .join("");
}

function renderNode() {
  const target = element("node-details");
  const node = state.summary?.node;
  if (!node) {
    target.innerHTML = '<p class="muted">No existe un snapshot del nodo.</p>';
    return;
  }
  if (!node.connected) {
    target.innerHTML =
      '<div class="empty-state"><strong>Sin conexión RPC</strong><p>' +
      escapeHtml(node.error || "Consulta no disponible") +
      "</p></div>";
    return;
  }
  const sync = Math.min(100, Number(node.verificationProgress || 0) * 100);
  target.innerHTML = [
    ["Red", node.chain || "—"],
    ["Altura", Number(node.blocks || 0).toLocaleString("es-CL")],
    ["Peers", String(node.peerCount ?? node.connections ?? 0)],
    ["Sincronización", sync.toFixed(2) + "%"],
    ["Mempool", Number(node.mempoolTransactions || 0).toLocaleString("es-CL") + " tx"],
    ["Última consulta", formatDate(node.checkedAt)]
  ]
    .map(
      (entry) =>
        '<div class="node-stat"><span>' +
        escapeHtml(entry[0]) +
        "</span><strong>" +
        escapeHtml(entry[1]) +
        "</strong></div>"
    )
    .join("");
}

function renderWallets() {
  const wallets = state.summary?.wallets || [];
  const target = element("wallet-grid");
  const simulation = element("simulation-wallet");
  simulation.innerHTML = wallets
    .map(
      (wallet) =>
        '<option value="' +
        escapeHtml(wallet.id) +
        '">' +
        escapeHtml(wallet.name) +
        "</option>"
    )
    .join("");
  if (!wallets.length) {
    target.innerHTML = '<div class="empty-state">Aún no hay wallets registradas.</div>';
    return;
  }

  target.innerHTML = wallets
    .map((wallet) => {
      const signers = (wallet.signers || [])
        .map(
          (signer) =>
            '<div class="signer-row"><div><strong>' +
            escapeHtml(signer.label) +
            "</strong><small>" +
            escapeHtml(signer.vendor + " " + signer.model) +
            "</small></div><small>" +
            escapeHtml(signer.firmwareAtSeedCreation) +
            " · " +
            escapeHtml(signer.fingerprint) +
            "</small></div>"
        )
        .join("");
      return (
        '<article class="wallet-card"><div class="wallet-card-header"><div>' +
        '<p class="eyebrow">' +
        escapeHtml(wallet.network) +
        "</p><h3>" +
        escapeHtml(wallet.name) +
        '</h3><span class="muted">' +
        escapeHtml(wallet.fingerprint) +
        "</span></div>" +
        '<span class="status-chip">' +
        escapeHtml(wallet.walletType) +
        "</span></div>" +
        '<div class="wallet-meta"><div><span>Saldo</span><strong>' +
        escapeHtml(formatBtc(wallet.balanceSats)) +
        " BTC</strong></div><div><span>Quorum</span><strong>" +
        escapeHtml(wallet.quorum.required + " de " + wallet.quorum.total) +
        "</strong></div><div><span>Fabricantes</span><strong>" +
        escapeHtml(wallet.quorum.independentVendors) +
        "</strong></div></div>" +
        '<div class="signer-list">' +
        signers +
        "</div></article>"
      );
    })
    .join("");
}

function renderIncidents() {
  const incidents = state.summary?.incidents || [];
  const target = element("incident-table");
  if (!incidents.length) {
    target.innerHTML = '<div class="empty-state">No hay incidentes registrados.</div>';
    return;
  }
  target.innerHTML =
    "<table><thead><tr><th>Severidad</th><th>Hallazgo y causa</th><th>Entidad</th>" +
    "<th>Estado</th><th>Acción</th></tr></thead><tbody>" +
    incidents
      .map((incident) => {
        const canAcknowledge = incident.status === "open";
        return (
          "<tr><td><span class=\"severity-chip " +
          escapeHtml(incident.severity) +
          "\">" +
          escapeHtml(severityLabel(incident.severity)) +
          "</span></td><td><strong>" +
          escapeHtml(incident.title) +
          "</strong><p>" +
          escapeHtml(incident.rootCause) +
          "</p><small>" +
          escapeHtml(incident.code) +
          "</small></td><td>" +
          escapeHtml(incident.entityType) +
          "<br><small>" +
          escapeHtml(incident.entityId) +
          '</small></td><td><span class="status-chip ' +
          escapeHtml(incident.status) +
          '">' +
          escapeHtml(statusLabel(incident.status)) +
          "</span></td><td>" +
          (canAcknowledge
            ? '<button class="small-button acknowledge-incident" data-incident-id="' +
              escapeHtml(incident.id) +
              '">Reconocer</button>'
            : "—") +
          "</td></tr>"
        );
      })
      .join("") +
    "</tbody></table>";
}

function renderAdvisories() {
  const target = element("advisory-grid");
  target.innerHTML = state.advisories
    .map((advisory) => {
      const mitigation = (advisory.mitigation || [])
        .slice(0, 5)
        .map((item) => "<li>" + escapeHtml(item) + "</li>")
        .join("");
      const sources = (advisory.sources || [])
        .map(
          (source) =>
            '<a href="' +
            escapeHtml(safeUrl(source.url)) +
            '" target="_blank" rel="noopener noreferrer">' +
            escapeHtml(source.label) +
            " ↗</a>"
        )
        .join("");
      return (
        '<article class="advisory-card ' +
        escapeHtml(advisory.severity) +
        '"><div class="advisory-card-header"><div><p class="eyebrow">' +
        escapeHtml(advisory.id) +
        "</p><h3>" +
        escapeHtml(advisory.title) +
        '</h3></div><span class="severity-chip ' +
        escapeHtml(advisory.severity) +
        '">' +
        escapeHtml(severityLabel(advisory.severity)) +
        "</span></div><p class=\"muted\">" +
        escapeHtml(advisory.summary) +
        "</p><ul>" +
        mitigation +
        '</ul><div class="source-links">' +
        sources +
        "</div></article>"
      );
    })
    .join("");
}

function renderSignerFields(count) {
  const target = element("signer-fields");
  target.innerHTML = Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    return (
      '<fieldset class="signer-fieldset"><h3>Firmante ' +
      number +
      '</h3><div class="form-grid">' +
      '<label>Fingerprint<input required name="signer' +
      index +
      'Fingerprint" pattern="[0-9a-fA-F]{8}" maxlength="8" placeholder="D' +
      number +
      'A2B3C4"></label>' +
      '<label>Fabricante<input required name="signer' +
      index +
      'Vendor" placeholder="COLDCARD"></label>' +
      '<label>Modelo<input required name="signer' +
      index +
      'Model" placeholder="Mk3"></label>' +
      '<label>Firmware al crear semilla<input required name="signer' +
      index +
      'Firmware" placeholder="4.1.9"></label>' +
      '<label>Canal<select name="signer' +
      index +
      'Track"><option value="standard">Standard</option><option value="edge">Edge</option></select></label>' +
      '<label>Origen<select name="signer' +
      index +
      'Origin"><option value="device">Dispositivo</option><option value="dice">Dados independientes</option><option value="external">Importada</option><option value="unknown">Desconocido</option></select></label>' +
      "</div></fieldset>"
    );
  }).join("");
}

function renderAll() {
  renderDashboard();
  renderWallets();
  renderIncidents();
  renderAdvisories();
}

async function refresh() {
  const [summary, advisories] = await Promise.all([
    api("/api/summary"),
    api("/api/advisories")
  ]);
  state.summary = summary;
  state.advisories = advisories.advisories;
  renderAll();
}

async function runScan() {
  const button = element("scan-button");
  setBusy(button, true, "Analizando…");
  try {
    const result = await api("/api/scan", {
      method: "POST",
      body: "{}"
    });
    await refresh();
    toast("Análisis completado: " + result.findings + " hallazgos activos.");
  } catch (error) {
    toast(error.message, "error");
  } finally {
    setBusy(button, false);
  }
}

async function refreshNode() {
  const button = element("refresh-node");
  setBusy(button, true, "…");
  try {
    await api("/api/node/refresh", { method: "POST", body: "{}" });
    await api("/api/scan", { method: "POST", body: "{}" });
    await refresh();
    toast("Snapshot de Bitcoin Core actualizado.");
  } catch (error) {
    toast(error.message, "error");
    await refresh();
  } finally {
    setBusy(button, false);
  }
}

async function submitWallet(form) {
  const formData = new FormData(form);
  const walletType = formData.get("walletType");
  const signerCount = walletType === "multisig" ? 3 : 1;
  const signers = Array.from({ length: signerCount }, (_, index) => ({
    label: "Firmante " + (index + 1),
    fingerprint: formData.get("signer" + index + "Fingerprint"),
    vendor: formData.get("signer" + index + "Vendor"),
    model: formData.get("signer" + index + "Model"),
    firmwareAtSeedCreation: formData.get("signer" + index + "Firmware"),
    firmwareTrack: formData.get("signer" + index + "Track"),
    seedOrigin: formData.get("signer" + index + "Origin")
  }));
  const payload = {
    name: formData.get("name"),
    fingerprint: formData.get("fingerprint"),
    walletType,
    network: formData.get("network"),
    balanceSats: Number(formData.get("balanceSats") || 0),
    quorum:
      walletType === "multisig"
        ? { required: 2, total: 3 }
        : { required: 1, total: 1 },
    signers
  };
  await api("/api/wallets", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  await api("/api/scan", { method: "POST", body: "{}" });
  form.reset();
  renderSignerFields(1);
  await refresh();
}

function randomTxid() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function simulateSpend() {
  const button = element("simulate-spend");
  const walletId = element("simulation-wallet").value;
  if (!walletId) return toast("Registra una wallet antes de simular.", "error");
  setBusy(button, true, "Simulando…");
  try {
    await api("/api/observe/transaction", {
      method: "POST",
      body: JSON.stringify({
        txid: randomTxid(),
        walletId,
        spendsWatchedWallet: true,
        source: "laboratory"
      })
    });
    await refresh();
    switchView("incidents");
    toast("Watchtower detectó un gasto sin aprobación.");
  } catch (error) {
    toast(error.message, "error");
  } finally {
    setBusy(button, false);
  }
}

document.querySelectorAll("[data-view-target]").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.viewTarget));
});

element("scan-button").addEventListener("click", runScan);
element("refresh-node").addEventListener("click", refreshNode);
element("simulate-spend").addEventListener("click", simulateSpend);
document.querySelector(".mobile-menu").addEventListener("click", () => {
  document.body.classList.toggle("menu-open");
});

element("wallet-type").addEventListener("change", (event) => {
  renderSignerFields(event.target.value === "multisig" ? 3 : 1);
});

element("wallet-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button[type="submit"]');
  setBusy(button, true, "Registrando…");
  try {
    await submitWallet(event.currentTarget);
    toast("Wallet registrada y analizada.");
  } catch (error) {
    toast(error.message, "error");
  } finally {
    setBusy(button, false);
  }
});

element("incident-table").addEventListener("click", async (event) => {
  const button = event.target.closest(".acknowledge-incident");
  if (!button) return;
  setBusy(button, true, "Guardando…");
  try {
    await api("/api/incidents/" + button.dataset.incidentId, {
      method: "PATCH",
      body: JSON.stringify({ status: "acknowledged" })
    });
    await refresh();
    toast("Incidente reconocido. El hallazgo continúa activo.");
  } catch (error) {
    toast(error.message, "error");
  } finally {
    setBusy(button, false);
  }
});

renderSignerFields(1);
refresh().catch((error) => toast(error.message, "error"));

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
