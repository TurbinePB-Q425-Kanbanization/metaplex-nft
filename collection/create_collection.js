import { 
  createCollection,
  mplCore,
} from '@metaplex-foundation/mpl-core'
import pkg from '@metaplex-foundation/mpl-core';
const { createV1 } = pkg;
// import { createV1, CreateArgsV1 } from '@metaplex-foundation/mpl-core';
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import os from 'os';
import {
  createGenericFile,
  createSignerFromKeypair,
  generateSigner,
  signerIdentity,
  transactionBuilder,
  sol,
} from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys'
import { base58 } from '@metaplex-foundation/umi/serializers'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv';
import bs58 from 'bs58';

const createCollection1 = async () => {
  //
  // ** Setting Up Umi **
  //

  const umi = createUmi('https://api.devnet.solana.com')
    .use(mplCore())
    .use(irysUploader({address: 'https://devnet.irys.xyz'}))
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const walletFile = path.join(os.homedir(), ".config", "solana", "id.json");

    const secretKeyString = fs.readFileSync(walletFile, "utf8");
    // Convert your walletFile onto a keypair.
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));


// // 4️⃣ Create keypair from the secret key bytes
const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);

    const myKeypairSigner = createSignerFromKeypair(umi, keypair);

  umi.use(signerIdentity(myKeypairSigner))
  //
  // ** Upload an image to Arweave **
  //
  const imagefile = fs.readFileSync(
    path.join('carbon_dreams.png')
  )
  const umiImageFile = createGenericFile(imagefile, 'carbon_dreams.png', {
    tags: [{ name: 'Content-Type', value: 'image/png' }],
  })
  const audiofile = fs.readFileSync(
    path.join('galactic_dance_music.mp3')
  )
  const umiAudioFile = createGenericFile(audiofile, 'galactic_dance_music.mp3', {
    tags: [{ name: 'Content-Type', value: 'audio/mp3' }],
  })

  const audiofile_2 = fs.readFileSync(
    path.join('infinite_equations.mp3')
  )
  const umiAudioFile_2 = createGenericFile(audiofile_2, 'infinite_equations.mp3', {
    tags: [{ name: 'Content-Type', value: 'audio/mp3' }],
  })

  const audiofile_3 = fs.readFileSync(
    path.join('infinite_equations_2.mp3')
  )
  const umiAudioFile_3 = createGenericFile(audiofile_3, 'infinite_equations_2.mp3', {
    tags: [{ name: 'Content-Type', value: 'audio/mp3' }],
  })

  const audiofile_4 = fs.readFileSync(
    path.join('whisper_in_the_waves.mp3')
  )
  const umiAudioFile_4 = createGenericFile(audiofile_4, 'whisper_in_the_waves.mp3', {
    tags: [{ name: 'Content-Type', value: 'audio/mp3' }],
  })


  // Here we upload the image to Arweave via Irys and we get returned a uri
  // address where the file is located. You can log this out but as the
  // uploader can takes an array of files it also returns an array of uris.
  // To get the uri we want we can call index [0] in the array.
  console.log('Uploading Files...')
  const imageUri = await umi.uploader.upload([umiImageFile, umiAudioFile, umiAudioFile_2, umiAudioFile_3, umiAudioFile_4]).catch((err) => {
    throw new Error(err)
  })
  console.log('imageUri: ' + imageUri[0])

  //
  // ** Upload Metadata to Arweave **
  //

  const metadata = {
    name: 'Carbon Dreams',
    description: 'This is a Collection of AI generated songs',
    image: imageUri[0],
    // external_url: 'https://example.com',
    properties: {
      files: [
        {
          uri: imageUri[1],
          type: 'audio/mp3',
        },
        {
          uri: imageUri[2],
          type: 'audio/mp3',
        },
        {
          uri: imageUri[3],
          type: 'audio/mp3',
        },
        {
          uri: imageUri[4],
          type: 'audio/mp3',
        },
      ],
      category: 'audio',
    },
  }

  console.log('Uploading Metadata...')
  const metadataUri = await umi.uploader.uploadJson(metadata).catch((err) => {
    throw new Error(err)
  })

  //
  // ** Creating the Collection **
  //

  const asset = generateSigner(umi)

  // // ✅ Step 1: Get blockhash first (before building the transaction)
  // const { blockhash } = await umi.rpc.getLatestBlockhash();

  // // ✅ Step 2: Create the transaction builder *with the blockhash set immediately*
  // const builder = transactionBuilder()
  // .setBlockhash(blockhash)
  // .setFeePayer(umi.identity)
  // .add(
  //   createV1(umi, {
  //     asset: collection, // signer
  //     name: 'Carbon Dreams',
  //     uri: 'https://example.com/metadata.json',
  //     // optional:
  //     symbol: 'CRBN',
  //     isCollection: true, // ✅ Mark as collection
  //   })
  // );

  // // ✅ Step 3: Build and send
  // const tx = await builder.build(umi);
  // ✅ Extract a real web3.js connection
  // const connection = umi.rpc.getConnection();

  // ✅ Convert Umi signer to web3 keypair
  // const signer = umi.identity ?? keypair;

  console.log('Creating Collection...')
  const tx = await createCollection(umi, {
    collection: asset,
    name: 'Carbon Dreams',
    uri: metadataUri,
    // collection: true,
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

createCollection1()