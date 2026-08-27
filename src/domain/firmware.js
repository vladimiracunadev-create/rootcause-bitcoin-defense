// Comparacion de versiones de firmware y coincidencia contra avisos.
//
// El corazon del producto es una pregunta muy concreta: la semilla de este
// firmante, nacio dentro del rango de firmware que declara un aviso? Para
// responderla hace falta ordenar versiones que los fabricantes escriben a su
// manera: `5.6.0`, `6.6.0X`, `1.5.0Q`, `v4.1.9`.
//
// No se usa semver: los fabricantes de hardware wallets no lo siguen. Se
// comparan los tres numeros y despues el sufijo como texto, que es lo que de
// verdad distingue un canal `edge` de uno `standard` en las series COLDCARD.
//
// Ante cualquier duda -version ilegible, rango imposible- se devuelve "no
// coincide". Inventar una coincidencia produciria una alarma falsa sobre unos
// fondos, y ese es el fallo mas caro que puede cometer este modulo.
function canonical(value) {
  return String(value || "").trim().toLowerCase();
}

export function parseFirmwareVersion(value) {
  const input = String(value || "").trim();
  const match = input.match(/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?([a-z0-9-]*)$/i);
  if (!match) return null;

  return {
    raw: input,
    numbers: [
      Number.parseInt(match[1] || "0", 10),
      Number.parseInt(match[2] || "0", 10),
      Number.parseInt(match[3] || "0", 10)
    ],
    suffix: canonical(match[4])
  };
}

export function compareFirmwareVersions(left, right) {
  const a = parseFirmwareVersion(left);
  const b = parseFirmwareVersion(right);
  if (!a || !b) throw new Error("Invalid firmware version");

  for (let index = 0; index < 3; index += 1) {
    if (a.numbers[index] < b.numbers[index]) return -1;
    if (a.numbers[index] > b.numbers[index]) return 1;
  }

  return a.suffix.localeCompare(b.suffix);
}

function isInRange(version, range) {
  try {
    if (
      range.minInclusive &&
      compareFirmwareVersions(version, range.minInclusive) < 0
    ) {
      return false;
    }
    if (
      range.maxInclusive &&
      compareFirmwareVersions(version, range.maxInclusive) > 0
    ) {
      return false;
    }
    if (
      range.minExclusive &&
      compareFirmwareVersions(version, range.minExclusive) <= 0
    ) {
      return false;
    }
    if (
      range.maxExclusive &&
      compareFirmwareVersions(version, range.maxExclusive) >= 0
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function advisoryAffectsWallet(advisory, wallet) {
  if (canonical(advisory.vendor) !== canonical(wallet.vendor)) return false;
  if (!wallet.firmwareAtSeedCreation) return false;

  return (advisory.affected || []).some((range) => {
    const modelMatches = (range.models || []).some(
      (model) => canonical(model) === canonical(wallet.model)
    );
    const trackMatches =
      !range.track ||
      canonical(range.track) === canonical(wallet.firmwareTrack || "standard");

    return (
      modelMatches &&
      trackMatches &&
      isInRange(wallet.firmwareAtSeedCreation, range)
    );
  });
}

export function matchingAdvisories(wallet, advisories) {
  return advisories.filter((advisory) =>
    advisoryAffectsWallet(advisory, wallet)
  );
}
