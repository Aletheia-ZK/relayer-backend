import { IncrementalMerkleTree } from '@zk-kit/incremental-merkle-tree';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import { poseidon } from 'circomlibjs'; // v0.0.8
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const MERKLE_TREE_HEIGHT = parseInt(
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  process.env.MERKLE_TREE_HEIGHT!
);

export function buildMerkleTree(leaves: string[]) {
  console.log(leaves);
  const tree = new IncrementalMerkleTree(poseidon, MERKLE_TREE_HEIGHT, 0, 2);

  for (const leaf of leaves) {
    tree.insert(leaf);
  }

  return tree;
}
