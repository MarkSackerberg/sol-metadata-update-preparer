#!/usr/bin/env node

import { Command, Option } from 'commander';
import { PublicKey } from '@metaplex-foundation/js';
import { copyUri, manifestToDecoded, fetchSingleNft, fetchAllNft } from './app';

const program = new Command();

program
  .command('fetch-single-nft')
  .description('Fetch a single NFTs off-chain metadata by mint address')
  .argument('<mintAddress>', 'mint address of the NFT')
  .argument('<downloadDir>', 'folder where the JSON should be saved')
  .option(
    '-r, --rpc [rpcUrl]',
    'rpc url',
    'https://solana-mainnet.rpc.extrnode.com',
  )
  .action((mintAddress, downloadDir, rpcUrl) => {
    fetchSingleNft(
      new PublicKey(mintAddress),
      downloadDir,
      rpcUrl.rpc,
      undefined,
    );
  });

program
  .command('fetch-all-nft')
  .description('Fetch all NFTs off-chain metadata based on mintlist')
  .argument(
    '<mintListFile>',
    'mintListFile containing the NFT addresses in JSON format',
  )
  .argument('<downloadDir>', 'folder where the JSONs should be saved')
  .option(
    '-r, --rpc [rpcUrl]',
    'rpc url',
    'https://solana-mainnet.rpc.extrnode.com',
  )
  .action((mintListFile: string, downloadDir: string, rpcUrl) => {
    fetchAllNft(mintListFile, downloadDir, rpcUrl.rpc);
  });

program
  .command('copy-uri <oldMetadataFolder> <updatedMetadataFolder>')
  .description(
    'Copy the URI from downloaded JSON files into json files with other metadata.',
  )
  .argument(
    '<oldMetadataFolder>',
    'path to folder containing the old metadata files',
  )
  .argument(
    '<updatedMetadataFolder>',
    'path to folder containing the metadata files that should be updated. The files should be named like the NFT. E.g. NFT Name "test #123" then the json file should be called 123.json',
  )
  .action((oldMetadataFolder: string, updatedMetadataFolder: string) => {
    copyUri(oldMetadataFolder, updatedMetadataFolder);
  });

program
  .command('manifest-to-decoded <arweaveManifestFile> <decodedMetadataFolder>')
  .description(
    'Convert the Arweave manifest file by bundlr to decoded metadata files',
  )
  .argument(
    '<arweaveManifestFile>',
    'path to arweave manifest file generated by bundlr',
  )
  .argument(
    '<decodedMetadataFolder>',
    'path to folder containing the on-chain metadata generated by metaboss',
  )
  .action((arweaveManifestFile: string, decodedMetadataFolder: string) => {
    manifestToDecoded(arweaveManifestFile, decodedMetadataFolder);
  });

program.parse(process.argv);
