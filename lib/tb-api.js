async function tbFetch(path, opts = {}) {
  const resp = await fetch(`/api/tb/${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts.headers },
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`TB ${resp.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

export async function getMe() {
  const resp = await fetch('/api/auth/me');
  if (!resp.ok) throw new Error('Not authenticated');
  return resp.json();
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
}

// ThingsBoard assigns this special null-UUID as customerId to Tenant Administrators
const TB_NULL_CUSTOMER_ID = '13814000-1dd2-11b2-8080-808080808080';

export async function loadGreenhouseData() {
  const user = await getMe();
  const customerId = user.customerId?.id;
  const isTenantAdmin = user.authority === 'TENANT_ADMIN' || customerId === TB_NULL_CUSTOMER_ID;

  let customer, assetsResp;
  if (isTenantAdmin) {
    customer = { title: 'Tenant Administrator', id: { id: 'admin' } };
    assetsResp = await tbFetch(`tenant/assets?pageSize=100&page=0`);
  } else {
    if (!customerId) throw new Error('Korisnički račun nema pripisanog OPG-a.');
    customer = await tbFetch(`customer/${customerId}`);
    assetsResp = await tbFetch(`customer/${customerId}/assets?pageSize=100&page=0`);
  }
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
    let deviceLat = null;
    let deviceLng = null;

    if (deviceRel) {
      deviceId = deviceRel.to.id;
      try {
        linkedDevice = await tbFetch(`device/${deviceId}`);

        const threshList = await tbFetch(
          `plugins/telemetry/DEVICE/${deviceId}/values/attributes/SERVER_SCOPE?keys=temperatureHighThreshold,humidityThresholdLow,humidityThresholdHigh,latitude,longitude`
        ).catch(() => []);
        const t = {};
        threshList.forEach(a => { t[a.key] = a.value; });

        rules[asset.id.id] = {
          tempMax: t.temperatureHighThreshold ?? 30,
          humMin:  t.humidityThresholdLow     ?? 45,
          humMax:  t.humidityThresholdHigh    ?? 60,
        };

        if (t.latitude != null) deviceLat = parseFloat(t.latitude);
        if (t.longitude != null) deviceLng = parseFloat(t.longitude);

        // Fallback: try CLIENT_SCOPE (ESP32 sends lat/lng as client attributes)
        if (deviceLat == null || deviceLng == null) {
          const clientAttrs = await tbFetch(
            `plugins/telemetry/DEVICE/${deviceId}/values/attributes/CLIENT_SCOPE?keys=latitude,longitude`
          ).catch(() => []);
          clientAttrs.forEach(a => { if (a.key === 'latitude') deviceLat = parseFloat(a.value); });
          clientAttrs.forEach(a => { if (a.key === 'longitude') deviceLng = parseFloat(a.value); });
        }

        // Fallback: try latest telemetry (GPS tracking devices)
        if (deviceLat == null || deviceLng == null) {
          const locTelem = await tbFetch(
            `plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=latitude,longitude`
          ).catch(() => ({}));
          const tLat = parseFloat(locTelem.latitude?.[0]?.value);
          const tLng = parseFloat(locTelem.longitude?.[0]?.value);
          if (!isNaN(tLat)) deviceLat = tLat;
          if (!isNaN(tLng)) deviceLng = tLng;
        }

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

    const validCoord = (v) => v != null && !isNaN(v);
    const houseLat = validCoord(deviceLat) ? deviceLat : (validCoord(parseFloat(attrs['latitude']))  ? parseFloat(attrs['latitude'])  : null);
    const houseLng = validCoord(deviceLng) ? deviceLng : (validCoord(parseFloat(attrs['longitude'])) ? parseFloat(attrs['longitude']) : null);

    houses.push({
      id: asset.id.id,
      name: asset.name,
      location: attrs['Lokacija'] || '',
      kultura:  attrs['Kultura']  || '',
      area:     Number(attrs['Površina']) || 0,
      opgId: isTenantAdmin ? 'admin' : customerId,
      type: linkedDevice?.name?.includes('VIRTUAL') ? 'virtualni' : 'fizički',
      deviceId: deviceId,
      lat: houseLat,
      lng: houseLng,
    });
  }

  const opgs = [{
    id: isTenantAdmin ? 'admin' : customerId,
    name: customer.title || 'OPG',
    owner: user.email || '',
    oib: '',
  }];

  return { houses, devices, rules, opgs, userEmail: user.email || '' };
}

export async function getLatestTelemetry(deviceId) {
  return tbFetch(
    `plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=temperature,humidity,lux,illuminance,light`
  );
}

export async function getTelemetryHistory(deviceId) {
  const end = Date.now();
  const start = end - 24 * 60 * 60 * 1000;
  return tbFetch(
    `plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=temperature,humidity,lux,illuminance,light&startTs=${start}&endTs=${end}&interval=600000&limit=144&agg=AVG`
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

export async function createAsset(name, customerId) {
  const asset = await tbFetch('asset', {
    method: 'POST',
    body: JSON.stringify({ name, type: 'greenhouse' }),
  });
  if (customerId && customerId !== 'admin') {
    await tbFetch(`customer/${customerId}/asset/${asset.id.id}`, { method: 'POST' });
  }
  return asset;
}

export async function deleteAsset(assetId) {
  return tbFetch(`asset/${assetId}`, { method: 'DELETE' });
}

export async function createDevice(name, customerId) {
  const device = await tbFetch('device', {
    method: 'POST',
    body: JSON.stringify({ name, type: 'default' }),
  });
  if (customerId && customerId !== 'admin') {
    await tbFetch(`customer/${customerId}/device/${device.id.id}`, { method: 'POST' });
  }
  return device;
}

export async function deleteDevice(deviceId) {
  return tbFetch(`device/${deviceId}`, { method: 'DELETE' });
}

export async function linkDeviceToAsset(assetId, deviceId) {
  return tbFetch('relation', {
    method: 'POST',
    body: JSON.stringify({
      from: { id: assetId, entityType: 'ASSET' },
      to: { id: deviceId, entityType: 'DEVICE' },
      type: 'Contains',
      typeGroup: 'COMMON',
    }),
  });
}
