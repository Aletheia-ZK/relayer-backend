/* eslint-disable @typescript-eslint/no-non-null-assertion */
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
import { ethers } from 'ethers';

import aletheiaArtifact from '../artifacts/contracts/Aletheia.sol/Aletheia.json';

const ALETHEIA_CONTRACT_ADDRESS = process.env.ALETHEIA_CONTRACT_ADDRESS!;
const PROVIDER_URL = process.env.PROVIDER_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;

import { createClient } from 'redis';

const app: Express = express();
app.use(cors());
app.use(express.json());

const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const client = createClient();
(async () => {
  client.on('error', (err) => console.log('Redis Client Error', err));
  await client.connect();
  console.log('Successfully connected to Redis');
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
  const abiCoder = new ethers.utils.AbiCoder();
  const BNIdentityCommitment = ethers.BigNumber.from(identityCommitment);
  const formattedIdentityCommitment = abiCoder.encode(
    ['uint256'],
    [BNIdentityCommitment]
  );
  const transaction = await contract.addMember(formattedIdentityCommitment);
  const transactionReceipt = await transaction.wait();
  if (transactionReceipt.status !== 1) {
    console.log('error');
  }
}

app.get('/attestation_1', async (req: Request, res: Response) => {
  const attestation1Root = await client.get('attestation_1_root');
  const attestation1Leaves = await client.get('attestation_1_leaves');
  res.send({
    attestation_1_root: attestation1Root,
    attestation_1_leaves: attestation1Leaves,
  });
});

app.get('/attestation_2', async (req: Request, res: Response) => {
  const attestation2Root = await client.get('attestation_2_root');
  const attestation2Leaves = await client.get('attestation_2_leaves');
  res.send({
    attestation_2_root: attestation2Root,
    attestation_2_leaves: attestation2Leaves,
  });
});

app.post('/identitycommitments', async (req: Request, res: Response) => {
  const identityCommitment = req.body.identityCommitment;
  console.log('Received new add identitycommitment: ', identityCommitment);
  await addMember(identityCommitment);
  res.sendStatus(200);
});

app.get('/identitytree', async (req: Request, res: Response) => {
  const identityRoot = await client.get('identity_root');
  const identityLeaves = await client.get('identity_leaves');
  res.send({
    identityRoot: identityRoot,
    identityLeaves: identityLeaves,
  });
});

app.get('/latestupdate', async (req: Request, res: Response) => {
  const latestUpdate = await client.get('latest_update');
  res.send({
    latest_update: latestUpdate,
  });
});

app.post('/tokens', async (req: Request, res: Response) => {
  const address = req.body.address;
  console.log('User: ', address, ' requests tokens.');

  const balance = await provider.getBalance(address);
  const balanceInEth = ethers.utils.formatEther(balance);
  console.log(`balance: ${balanceInEth} ETH`);
  const amount = ethers.BigNumber.from('10000000000000000');
  if (balance.gt(amount)) {
    return res.json({ status: 2 });
  }

  const tx = {
    to: address,
    // value: ethers.utils.parseEther('0.1'),
    value: amount,
  };

  const transactionResponse = await wallet.sendTransaction(tx);
  try {
    await transactionResponse.wait();
    return res.json({ status: 1 });
  } catch {
    return res.json({ status: 3 });
  }
});

console.log('Listening on port 4000');
app.listen(4000);
