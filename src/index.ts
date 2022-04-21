import express, { Express, Request, Response } from 'express';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// import { poseidon } from 'circomlibjs'; // v0.0.8
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
import { ethers } from 'ethers';

import aletheiaArtifact from '../artifacts/contracts/Aletheia.sol/Aletheia.json';

const ATTESTATION_MERKLE_TREE_HEIGHT = parseInt(
  process.env.ATTESTATION_MERKLE_TREE_HEIGHT!
);
const ALETHEIA_CONTRACT_ADDRESS = process.env.ALETHEIA_CONTRACT_ADDRESS!;
const PROVIDER_URL = process.env.PROVIDER_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;

import { createClient } from 'redis';

const app: Express = express();
app.use(express.json());

const client = createClient();
(async () => {
  client.on('error', (err) => console.log('Redis Client Error', err));
  await client.connect();
})();

function getContract() {
  const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(
    ALETHEIA_CONTRACT_ADDRESS,
    aletheiaArtifact['abi'],
    wallet
  );
  return contract;
}

async function addMember(identityCommitment: string) {
  const contract = getContract();
  const formattedIdentityCommitment =
    ethers.utils.formatBytes32String(identityCommitment);
  const transaction = await contract.addMember(formattedIdentityCommitment);
  const transactionReceipt = await transaction.wait();
  console.log(transactionReceipt);
  if (transactionReceipt.status !== 1) {
    console.log('error');
  }
}

// const MERKLE_TREE_HEIGHT = parseInt(process.env.MERKLE_TREE_HEIGHT!);

app.get('/attestation_1', async (req: Request, res: Response) => {
  const attestation1Root = await client.get('attestation_1_root');
  const attestation1Leaves = await client.get('attestation_1_leaves');
  res.send({
    attestation_1_root: attestation1Root,
    attestation1Leaves: attestation1Leaves,
  });
});

app.post('/identitycommitments', async (req: Request, res: Response) => {
  const identityCommitment = req.body.identityCommitment;
  console.log(identityCommitment);
  console.log(req.body);
  await addMember(identityCommitment);
  res.send(identityCommitment);
});

// router.get('/attestation_1/proof/:pubkey', async (ctx: any, next: any) => {
//   const attestation1LeavesRedis = await client.get('attestation_1_leaves');
//   const pubKey = ctx.params.pubkey;
//   if (attestation1LeavesRedis) {
//     const attestation1Leaves = JSON.parse(attestation1LeavesRedis);
//     const tree = new IncrementalMerkleTree(poseidon, MERKLE_TREE_HEIGHT, 0, 2);

//     // console.log('Pub key:', pubKey);
//     // console.log('Tree: ', tree.elements);
//     for (const leaf of attestation1Leaves) {
//       tree.insert(leaf);
//     }

//     // check if pub key is in tree
//     if (tree.indexOf(pubKey) > -1) {
//       // calculate inclusion proof for pubKey
//       ctx.body = {
//         pubKey: pubKey,
//         proof: tree.createProof(pubKey),
//       };
//     } else {
//       ctx.body = {
//         pubKey: pubKey,
//         proof: null,
//       };
//     }
//   }
//   next();
// });

// app.use(koaBody());

// app.use(router.routes()).use(router.allowedMethods());

console.log('Listening on port 4000');
app.listen(4000);
