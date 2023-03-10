
# Solana NFT Update preparer

## What does it do?
This repo will not update the NFT data for you. It is a CLI to make updates easier, e.g. by downloading old metadata, copying old image links into new metadata and preparing files to update Metadata with [metaboss](https://github.com/samuelvanderwaal/metaboss).

This CLI was created with a specific usecase in mind, but will aligned in the future.

## Install

1. Install [node.js](https://nodejs.org/en/download/), [yarn](https://yarnpkg.com/getting-started/install) (or use npm).
2. Clone this repository, and using a terminal navigate to its directory.
3. Run `yarn` or `npm install` to install the dependencies.

## Run

1. Run `ts-node src/cli.ts` to start the application. It will show the help command.
```
npx ts-node src/cli.ts                                                                   
Usage: cli [options] [command]

Options:
  -h, --help                                                                                                       display help for command

Commands:
  fetch-single-nft [options] <mintAddress> <downloadDir>                                                           Fetch a single NFTs off-chain metadata by mint address
  fetch-all-nft [options] <mintListFile> <downloadDir>                                                             Fetch all NFTs off-chain metadata based on mintlist
  copy-uri <oldMetadataFolder> <updatedMetadataFolder> <oldMetadataFolder> <updatedMetadataFolder>                 Copy the URI from downloaded JSON files into UpdatedMetadata files
  manifest-to-decoded <arweaveManifestFile> <decodedMetadataFolder> <arweaveManifestFile> <decodedMetadataFolder>  Convert the Arweave manifest file by bundlr to decoded metadata files
  help [command]                                                                                                   display help for command
```

## Example
Process flow that I am often following is:
1. Download old NFT off-chain metadata using `ts-node src/cli.ts fetch-all-nft ../mints.json downloadFolder`
2. Get the image urls and add them to new JSON files `ts-node src/cli.ts copy-uri downloadFolder updatedFolder`
3. Upload the new JSON files using [Bundlr](https://docs.bundlr.network/CLI/uploading-a-folder) `bundlr upload-dir updatedFolder -h https://node1.bundlr.network -w wallet.json -c arweave` 
4. Decode the on-chain metadata of the nfts using `metaboss decode mint -o decoded -L mints.json --full` 
4. Add the URIs of the JSON into the decoded metadata files `ts-node src/cli.ts manifest-to-decoded updatedFolder-manifest.json decoded`
5. Update the NFTs with metaboss `metaboss update data-all -d decoded`

## Contact
If you have any issues or ideas feel free to contact me on Discord (Mark Sackerberg#7975), [Twitter](https://twitter.com/MarkSackerberg) or open a issue here on Github.

#### This project was created using [themetalfleece/nodejs-typescript-template](https://github.com/themetalfleece/nodejs-typescript-template)
