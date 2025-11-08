// index.js
import { create, mplCore } from '@metaplex-foundation/mpl-core';
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import os from 'os';
import {
  getKeypairFromEnvironment,
  getExplorerLink,
} from "@solana-developers/helpers";
import {
  createGenericFile,
  generateSigner,
  keypairIdentity,
  signerIdentity,
  createSignerFromKeypair,
  sol,
} from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys'
import { base58 } from '@metaplex-foundation/umi/serializers'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv';

const createNft = async () => {
  //
  // ** Setting Up Umi **
  //

  const umi = createUmi('https://api.devnet.solana.com')
    .use(mplCore())
    .use(
      irysUploader({
        // mainnet address: "https://node1.irys.xyz"
        // devnet address: "https://devnet.irys.xyz"
        address: 'https://devnet.irys.xyz',
      })
    )

    // Generate a new keypair signer.
    // const signer = generateSigner(umi)

    // You will need to us fs and navigate the filesystem to
    // load the wallet you wish to use via relative pathing.
    const walletFile = path.join(os.homedir(), ".config", "solana", "id.json");

    const secretKeyString = fs.readFileSync(walletFile, "utf8");
    // Convert your walletFile onto a keypair.
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));


// // 4️⃣ Create keypair from the secret key bytes
const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);

    const myKeypairSigner = createSignerFromKeypair(umi, keypair);

    // Load the keypair into umi.
    umi.use(keypairIdentity(myKeypairSigner));

  // Airdrop 1 SOL to the identity
  // if you end up with a 429 too many requests error, you may have to use
  // the filesystem wallet method or change rpcs.
  // console.log('Airdropping 1 SOL to identity')
  // await umi.rpc.airdrop(umi.identity.publicKey, sol(5))
  const connection = new Connection(clusterApiUrl('devnet'));
  const balance = await connection.getBalance(new PublicKey(umi.payer.publicKey));
  console.log("Payer:", umi.payer.publicKey.toString());
  console.log("Wallet balance:", balance / 1e9, "SOL");
  //
  // ** Upload an image to Arweave **
  //

  // use `fs` to read file via a string path.
  // You will need to understand the concept of pathing from a computing perspective.

  const imagefile = fs.readFileSync(
    path.join('lost_cosmonaut.png')
  )

  const umiImageFile = createGenericFile(imagefile, 'lost_cosmonaut.png', {
    tags: [{ name: 'Content-Type', value: 'image/png' }],
  })
  const audiofile = fs.readFileSync(
    path.join('lost_cosmonaut.mp3')
  )
  const umiAudioFile = createGenericFile(audiofile, 'lost_cosmonaut.mp3', {
    tags: [{ name: 'Content-Type', value: 'audio/mp3' }],
  })
  // Here we upload the image to Arweave via Irys and we get returned a uri
  // address where the file is located. You can log this out but as the
  // uploader can takes an array of files it also returns an array of uris.
  // To get the uri we want we can call index [0] in the array.
  console.log('Uploading Files...')
  const imageUri = await umi.uploader.upload([umiImageFile, umiAudioFile]).catch((err) => {
    throw new Error(err)
  })

  console.log('imageUri: ' + imageUri[0])


  //
  // ** Upload Metadata to Arweave **
  //

  const metadata = {
    name: 'Lost Cosmonaut',
    description: 'This is an NFT with AI generated music and art.',
    image: imageUri[0],
    // external_url: 'https://example.com',
    attributes: [
      {
        trait_type: 'Genre',
        value: 'Space Lofi',
      },
      {
        trait_type: 'Author',
        value: 'Nirnay',
      },
    ],
    properties: {
      files: [
        {
          uri: imageUri[1],
          type: 'audio/mp3',
        },
      ],
      category: 'audio',
    },
  }

  // Call upon umi's `uploadJson` function to upload our metadata to Arweave via Irys.

  console.log('Uploading Metadata...')
  const metadataUri = await umi.uploader.uploadJson(metadata).catch((err) => {
    throw new Error(err)
  })

  //
  // ** Creating the NFT **
  //

  // We generate a signer for the NFT
  const asset = generateSigner(umi)

  console.log('Creating NFT...')
  const tx = await create(umi, {
    asset: asset,
    name: 'Lost Cosmonaut',
    uri: metadataUri,
  }).sendAndConfirm(umi)

  // Finally we can deserialize the signature that we can check on chain.
  const signature = base58.deserialize(tx.signature)[0]

  // Log out the signature and the links to the transaction and the NFT.
  console.log('\nNFT Created')
  console.log('View Transaction on Solana Explorer')
  console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`)
  console.log('\n')
  console.log('View NFT on Metaplex Explorer')
  console.log(`https://core.metaplex.com/explorer/${asset.publicKey}?env=devnet`)
}

createNft()