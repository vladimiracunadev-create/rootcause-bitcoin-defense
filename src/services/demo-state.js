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
