
export async function getJwks() {
  const googleCerts = await fetch('https://www.googleapis.com/oauth2/v3/certs').then(res => res.json());
  let jwks = [];
  for (const key of googleCerts.keys) {
    // convert key.n from base64 to hex
    key.n = '0x' + Buffer.from(key.n, 'base64').toString('hex');
    const r = {kid: key.kid, n: key.n};
    console.log(r);
    jwks.push(r);
  }
  return jwks;
}

getJwks();
