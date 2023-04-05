import { JsonMetadata } from '@metaplex-foundation/js';
import * as fs from 'fs';
import { Metaplex, PublicKey } from '@metaplex-foundation/js';
import { Connection } from '@solana/web3.js';

interface Path {
  id: string;
}

interface UpdatedMetadataManifest {
  manifest: string;
  version: string;
  paths: { [key: string]: Path };
}

export interface decodedMetadata {
  key: string;
  update_authority: string;
  mint: string | undefined;
  mint_account: string | undefined;
  data: Data | undefined;
  nft_data: Data | undefined;
  primary_sale_happened: boolean;
  is_mutable: boolean;
  edition_nonce: number;
  token_standard: string;
  collection: null;
  uses: null;
  collection_details: null;
  programmable_config: null;
}

export interface Data {
  name: string;
  symbol: string;
  uri: string;
  seller_fee_basis_points: number;
  creators: Creator[];
}

export interface Creator {
  address: string;
  verified: boolean;
  share: number;
}

// 1. download off chain metadata
const errorlist: string[] = [];
export async function fetchSingleNft(
  mintAddress: PublicKey,
  downloadDir: string,
  rpcUrl: string,
  metaplex: Metaplex | undefined,
) {
  if (!metaplex) {
    const connection = new Connection(rpcUrl, 'confirmed');
    metaplex = new Metaplex(connection);
  }

  try {
    let count = 0;
    const mints_data = [];
    const nft = await metaplex.nfts().findByMint({ mintAddress });
    mints_data.push(nft);
    count = count + 1;
    console.log(count);
    if (!nft || !nft.name) {
      throw new Error('Something bad happened');
    }
    const json = JSON.stringify(nft.json);
    fs.writeFile(
      `${downloadDir}/${mintAddress.toBase58()}.json`,
      json,
      'utf8',
      function () {
        console.log('done');
      },
    );
  } catch (e) {
    errorlist.push(mintAddress.toBase58());
    console.error(
      `error downloading or saving ${mintAddress.toBase58()}: ${e} `,
    );
  }
}

export async function fetchAllNft(
  mintListFile: string,
  downloadDir: string,
  rpcUrl: string,
) {
  const connection = new Connection(rpcUrl, 'confirmed');
  const metaplex = new Metaplex(connection);
  const raw = fs.readFileSync(mintListFile);
  const mint_list = JSON.parse(raw.toString());
  const mint_list_keys = mint_list.map(function (x: string) {
    return new PublicKey(x);
  });

  //check if folder exists and create it
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir);
  }
  let count = 0;
  for (const mintAddress of mint_list_keys) {
    await fetchSingleNft(
      mintAddress,
      downloadDir,
      'https://solana-mainnet.rpc.extrnode.com',
      metaplex,
    );
    count = count++;
    console.log(`${count}/${mint_list_keys.length}`);
  }
  console.log(errorlist);
}

// 2 copy uri from downloaded json files into UpdatedMetadata files
export async function copyUri(
  oldMetadataFolder: string,
  updatedMetadataFolder: string,
) {
  const files = fs.readdirSync(oldMetadataFolder);
  files.forEach((file) => {
    const oldMetadataJson: JsonMetadata = JSON.parse(
      fs.readFileSync(`${oldMetadataFolder}/${file}`, 'utf-8'),
    );
    let number = 0;
    if (oldMetadataJson.name) {
      number = parseInt(oldMetadataJson.name.replace(/[^0-9]/g, ''));
    } else {
      throw new Error('Metadata error: Name does not contain number');
    }
    const updatedMetadataJson: JsonMetadata = JSON.parse(
      fs.readFileSync(`${updatedMetadataFolder}/${number}.json`, 'utf-8'),
    );
    updatedMetadataJson.image = oldMetadataJson.image;
    if (!updatedMetadataJson.properties) {
      console.log(number);
      throw new Error('updatedMetadataJson has no properties');
    }
    if (
      !updatedMetadataJson.properties ||
      !updatedMetadataJson.properties.files ||
      !updatedMetadataJson.properties.files[0]
    ) {
      throw new Error('updatedMetadataJson has no properties');
    }
    updatedMetadataJson.properties.files[0].uri = oldMetadataJson.image;

    fs.writeFileSync(
      `${updatedMetadataFolder}/${number}.json`,
      JSON.stringify(updatedMetadataJson),
    );
  });
}

export async function manifestToDecoded(
  arweaveManifestFile: string,
  decodedMetadataFolder: string,
) {
  const errorlist: string[] = [];
  const arweaveManifest: UpdatedMetadataManifest = JSON.parse(
    fs.readFileSync(`${arweaveManifestFile}`, 'utf-8'),
  );

  const decodedFiles = fs.readdirSync(decodedMetadataFolder);
  decodedFiles.forEach((file) => {
    const decodedMetadataJSON: decodedMetadata = JSON.parse(
      fs.readFileSync(`${decodedMetadataFolder}/${file}`, 'utf-8'),
    );
    let number = 0;
    if (decodedMetadataJSON.data) {
      number = parseInt(decodedMetadataJSON.data.name.replace(/[^0-9]/g, ''));
    } else {
      errorlist.push(file);
      throw new Error('Metadata error: Name does not contain number!');
    }

    const arweaveTx = arweaveManifest.paths[`${number}.json`].id;
    const arweaveUri = `https://arweave.net/${arweaveTx}`;
    decodedMetadataJSON.data.uri = arweaveUri;
    decodedMetadataJSON.data.name = decodedMetadataJSON.data.name.replace(
      /\u0000/g,
      '',
    );
    decodedMetadataJSON.data.symbol = decodedMetadataJSON.data.symbol.replace(
      /\u0000/g,
      '',
    );
    decodedMetadataJSON.mint_account = decodedMetadataJSON.mint;
    delete decodedMetadataJSON.mint;
    decodedMetadataJSON.nft_data = decodedMetadataJSON.data;
    delete decodedMetadataJSON.data;

    fs.writeFileSync(
      `${decodedMetadataFolder}/${file}`,
      JSON.stringify(decodedMetadataJSON),
    );

    delete arweaveManifest.paths[`${number}.json`];
  });
}

export async function metabossSnapshotToSugarAirdrop(
  inputFile: string,
  outputFile: string,
) {
  type Item = {
    owner_wallet: string;
    mint_account: string;
    metadata_account: string;
    associated_token_address: string;
  };

  fs.readFile(inputFile, (err, data) => {
    if (err) {
      console.error(`Error reading input file: ${err}`);
      return;
    }

    const items: Item[] = JSON.parse(data.toString());

    const result: { [key: string]: number } = {};

    items.forEach((item) => {
      if (item.owner_wallet in result) {
        result[item.owner_wallet]++;
      } else {
        result[item.owner_wallet] = 1;
      }
    });

    fs.writeFile(outputFile, JSON.stringify(result), (err) => {
      if (err) {
        console.error(`Error writing output file: ${err}`);
        return;
      }

      console.log(`Result saved to ${outputFile}`);
    });
  });
}
