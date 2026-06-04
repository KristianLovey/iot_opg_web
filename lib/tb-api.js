async function tbFetch(path, opts = {}) {
  const resp = await fetch(`/api/tb/${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts.headers },
  });
  if (!resp.ok) throw new Error(`TB ${resp.status}: ${await resp.text()}`);
  if (resp.status === 204) return null;
  return resp.json();
}

export async function getMe() {
  const resp = await fetch('/api/auth/me');
  if (!resp.ok) throw new Error('Not authenticated');
  return resp.json();
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
}

export async function loadGreenhouseData() {
  const user = await getMe();
  const customerId = user.customerId?.id;
  if (!customerId) throw new Error('Korisnički račun nema pripisanog OPG-a.');

  const customer = await tbFetch(`customers/${customerId}`);
  const assetsResp = await tbFetch(`customer/${customerId}/assets?pageSize=100&page=0`);
  const assets = assetsResp.data || [];

  const houses = [];
  const devices = [];
  const rules = {};

  for (const asset of assets) {
    // Asset attributes: Kultura, Lokacija, Površina
    const attrList = await tbFetch(
      `plugins/telemetry/ASSET/${asset.id.id}/values/attributes/SERVER_SCOPE`
    ).catch(() => []);
    const attrs = {};
    attrList.forEach(a => { attrs[a.key] = a.value; });

    // Relations: find linked Device
    const relations = await tbFetch(`relations?fromId=${asset.id.id}&fromType=ASSET`).catch(() => []);
    const deviceRel = relations.find(r => r.to?.entityType === 'DEVICE');

    let linkedDevice = null;
    let deviceId = null;

    if (deviceRel) {
      deviceId = deviceRel.to.id;
      try {
        linkedDevice = await tbFetch(`device/${deviceId}`);

        const threshList = await tbFetch(
          `plugins/telemetry/DEVICE/${deviceId}/values/attributes/SERVER_SCOPE?keys=temperatureHighThreshold,humidityThresholdLow,humidityThresholdHigh`
        ).catch(() => []);
        const t = {};
        threshList.forEach(a => { t[a.key] = a.value; });

        rules[asset.id.id] = {
          tempMax: t.temperatureHighThreshold ?? 30,
          humMin:  t.humidityThresholdLow     ?? 45,
          humMax:  t.humidityThresholdHigh    ?? 60,
        };

        devices.push({
          id: deviceId,
          name: linkedDevice.name,
          type: linkedDevice.name?.includes('VIRTUAL') ? 'virtualni' : 'ESP',
          houseId: asset.id.id,
          online: !!linkedDevice.active,
          lastSeen: linkedDevice.createdTime || Date.now(),
          firmware: '1.4.x',
        });
      } catch (e) {
        console.warn('Device load failed', deviceId, e);
      }
    }

    if (!rules[asset.id.id]) {
      rules[asset.id.id] = { tempMax: 30, humMin: 45, humMax: 60 };
    }

    houses.push({
      id: asset.id.id,
      name: asset.name,
      location: attrs['Lokacija'] || '',
      kultura:  attrs['Kultura']  || '',
      area:     Number(attrs['Površina']) || 0,
      opgId: customerId,
      type: linkedDevice?.name?.includes('VIRTUAL') ? 'virtualni' : 'fizički',
      deviceId: deviceId,
    });
  }

  const opgs = [{
    id: customerId,
    name: customer.title || 'OPG',
    owner: user.email || '',
    oib: '',
  }];

  return { houses, devices, rules, opgs };
}

export async function getLatestTelemetry(deviceId) {
  return tbFetch(
    `plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=temperature,humidity,lux`
  );
}

export async function getTelemetryHistory(deviceId) {
  const end = Date.now();
  const start = end - 24 * 60 * 60 * 1000;
  return tbFetch(
    `plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=temperature,humidity,lux&startTs=${start}&endTs=${end}&interval=600000&limit=144&agg=AVG`
  );
}

export async function saveAssetAttributes(assetId, attrs) {
  return tbFetch(`plugins/telemetry/ASSET/${assetId}/SERVER_SCOPE`, {
    method: 'POST',
    body: JSON.stringify(attrs),
  });
}

export async function saveDeviceThresholds(deviceId, thresholds) {
  return tbFetch(`plugins/telemetry/DEVICE/${deviceId}/SERVER_SCOPE`, {
    method: 'POST',
    body: JSON.stringify({
      temperatureHighThreshold: thresholds.tempMax,
      humidityThresholdLow:     thresholds.humMin,
      humidityThresholdHigh:    thresholds.humMax,
    }),
  });
}
