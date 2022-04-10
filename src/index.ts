import Koa from 'koa';
import { createClient } from 'redis';

const app = new Koa();
const client = createClient();

// const client = createClient();
// client.on('error', (err) => console.log('Redis Client Error', err));
// await client.connect();

(async () => {
  client.on('error', (err) => console.log('Redis Client Error', err));
  await client.connect();
})();

app.use(async (ctx) => {
  const attestation1Root = await client.get('attestation_1_root');
  const attestation1Leaves = await client.get('attestation_1_root');
  console.log('Root value: ', attestation1Root);
  ctx.body = {
    attestation_1_root: attestation1Root,
    attestation1Leaves: attestation1Leaves,
  };
});

console.log('Listening on port 4000');
app.listen(4000);

// api 1: get_assestations => name, id
// api 2: get_assestation(id) => all leaves
// check redis for updates

// import exampleApi from 'api/exampleApi';
// const router = new KoaRouter();
// exampleApi(router);
// app.use(router.routes());
// app.listen(process.env.PORT || 3000);
