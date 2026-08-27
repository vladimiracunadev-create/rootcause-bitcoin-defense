// Estado inicial: el vacio real y el de demostracion.
//
// El estado de demostracion no es relleno bonito. Esta construido para que la
// aplicacion arranque MOSTRANDO hallazgos verdaderos de su propio motor:
//
//   - una single-sig COLDCARD Mk3 con firmware 4.1.9, que cae dentro del rango
//     del aviso BTC-ADV-2026-COLDCARD-ENTROPY (dispara BTC-KEY-001) y ademas
//     concentra alto valor en una sola clave (dispara BTC-CUSTODY-001);
//   - una 2-de-3 con tres fabricantes distintos, que es como se ve una custodia
//     correcta y no dispara nada.
//
// Asi la primera pantalla ensena a la vez el problema y su forma sana. Las
// huellas son ficticias y legibles a proposito (`C01DC4AD`, `A11CE123`): nadie
// debe confundirlas con una wallet real.
//
// La verificacion del release comprueba que `totals.wallets >= 1` al arrancar
// el artefacto instalado: es asi como se detecta el fallo clasico de empaquetar
// una aplicacion que abre vacia.
export function createEmptyState() {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
    wallets: [],
    incidents: [],
    approvals: [],
    observedTransactions: [],
    privacyEvents: [],
    audit: [],
    node: null
  };
}

export function createDemoState() {
  const state = createEmptyState();
  state.wallets = [
    {
      id: "wallet-demo-coldcard",
      name: "Reserva histórica",
      fingerprint: "C01DC4AD",
      network: "mainnet",
      walletType: "single-sig",
      balanceSats: 75000000,
      status: "active",
      quorum: { required: 1, total: 1, independentVendors: 1 },
      signers: [
        {
          id: "signer-demo-coldcard",
          label: "Firmante principal",
          fingerprint: "C01DC4AD",
          vendor: "COLDCARD",
          model: "Mk3",
          firmwareAtSeedCreation: "4.1.9",
          firmwareTrack: "standard",
          seedOrigin: "device",
          createdAt: "2024-06-15T00:00:00Z"
        }
      ],
      tags: ["demo", "cold-storage"]
    },
    {
      id: "wallet-demo-multisig",
      name: "Tesorería independiente 2-de-3",
      fingerprint: "A11CE123",
      network: "mainnet",
      walletType: "multisig",
      balanceSats: 230000000,
      status: "active",
      quorum: { required: 2, total: 3, independentVendors: 3 },
      signers: [
        {
          id: "signer-demo-1",
          label: "Firmante norte",
          fingerprint: "A11CE124",
          vendor: "COLDCARD",
          model: "Mk5",
          firmwareAtSeedCreation: "5.6.0",
          firmwareTrack: "standard",
          seedOrigin: "device",
          createdAt: "2026-08-16T00:00:00Z"
        },
        {
          id: "signer-demo-2",
          label: "Firmante centro",
          fingerprint: "A11CE125",
          vendor: "Trezor",
          model: "Safe 5",
          firmwareAtSeedCreation: "2.8.10",
          firmwareTrack: "standard",
          seedOrigin: "device",
          createdAt: "2026-08-16T00:00:00Z"
        },
        {
          id: "signer-demo-3",
          label: "Firmante sur",
          fingerprint: "A11CE126",
          vendor: "BitBox",
          model: "BitBox02",
          firmwareAtSeedCreation: "9.23.0",
          firmwareTrack: "standard",
          seedOrigin: "device",
          createdAt: "2026-08-16T00:00:00Z"
        }
      ],
      tags: ["demo", "treasury", "multisig"]
    }
  ];
  state.node = {
    connected: true,
    endpoint: "demo://bitcoin-core",
    checkedAt: new Date().toISOString(),
    chain: "main",
    blocks: 914321,
    headers: 914321,
    initialBlockDownload: false,
    verificationProgress: 1,
    bestBlockHash: "demo",
    warnings: [],
    connections: 12,
    peerCount: 12,
    peerNetworks: ["ipv4", "ipv6", "onion"],
    mempoolTransactions: 18432,
    mempoolUsageBytes: 48234496,
    mempoolMaxBytes: 314572800,
    mempoolMinFee: 0.00001000
  };
  return state;
}
