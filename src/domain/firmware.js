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
