import * as solanaWeb3 from "@solana/web3.js";
import * as splToken from "@solana/spl-token";

async function createNFT() {

    // connect to cluster
    let connection = new solanaWeb3.Connection(
        solanaWeb3.clusterApiUrl("devnet"),
        "confirmed",
    );

    // generate a new wallet keypair and airdrop SOL
    // fromWallet: create new pair of public and private keys using
    //     Keypair.generate() method
    let fromWallet = solanaWeb3.Keypair.generate();
    // The requestAirdrop() method takes a public Key, and the amount of
    // lamports in SOL you would like to receive. Lamports are Solana's
    // equivalent to wei, the smallest amount that a SOL can be broken into.
    // Most methods that require a number will default to the lamport
    // measurement. In this case, the LAMPORTS_PER_SOL is a constant that
    // represents 1 SOL worth of lamports.
    let fromAirDropSignature = await connection.requestAirdrop(
        fromWallet.publicKey,
        solanaWeb3.LAMPORTS_PER_SOL
    );
    // wait for airdrop confirmation
    // This call allows a signed transaction to be passed as an argument and
    // have the program wait until it has been confirmed before moving on to 
    // other portions of the code. This is important as in the next step a fee
    // will have to be paid, and the airdrop funds will be required.
    await connection.confirmTransaction(fromAirDropSignature);

    // create new token mint
    let mint = await splToken.Token.createMint(
        connection,
        fromWallet,
        fromWallet.publicKey,
        null,
        9,
        splToken.TOKEN_PROGRAM_ID
    );
};
