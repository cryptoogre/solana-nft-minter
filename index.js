const solanaWeb3 = require("@solana/web3.js");
const splToken = require("@solana/spl-token");

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
        connection, // connection to the solana network
        fromWallet, // the account that will pay the fee
        // the public key that has the authority to mint tokens of this type
        fromWallet.publicKey,
        // the public key that can freeze tokens of this type (optional)
        null,
        // amount of decimal places for the token. Solana tokens have 9 places
        9,
        // this creates the account (mint) associated with public key.
        // The chain of custody is as follows: the NFT resides in the account
        // and the wallet owns this account (keys -> wallet -> account)
        splToken.TOKEN_PROGRAM_ID
    );

    // get the token account of the fromWallet Solana adress, if it does not
    // exist, create it
    let fromTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
        fromWallet.publicKey
    );

    // The following code block creates a wallet with a separate set of
    // public/secret keys and then creates an account linking the mint variable
    // to the newly created wallet above.

    // generate a new wallet to recieve newly minted token
    let toWallet = solanaWeb3.Keypair.generate();

    // get the token account of the toWallet Solana address if it does not
    // exist, create it
    let toTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
        toWallet.publicKey
    );

    // minting 1 new token to the toTokenAccount account just returned/created
    await mint.mintTo(
        fromTokenAccount.address, // who it is going to
        fromWallet.publicKey, // minting authority
        [], // multisig
        1000000000 // how many? exactly one token
    );

    // the most crucial part of the process. SetAuthority() ensures that
    // additional tokens of this type cannot be created. This action cannot be
    // undone
    await mint.setAuthority(
        mint.publicKey, // account of the token
        null, // new authority to be set
        "MintTokens", // type of authority that the account currently has
        fromWallet.publicKey, // public key of the current authority holder
        [] // array of signers
    );

    // add token transfer instructions to transaction
    let transaction = new solanaWeb3.Transaction().add(
        splToken.Token.createTransferInstruction(
            splToken.TOKEN_PROGRAM_ID,
            fromTokenAccount.address,
            toTokenAccount.address,
            fromWallet.publicKey,
            [],
            1
        )
    );

    // sign transaction, broadcast, and confirm
    let signature = await solanaWeb3.sendAndConfirmTransaction(
        connection,
        transaction,
        [fromWallet],
        {commitment: "confirmed"}
    );

    console.log("SIGNATURE", signature);
};

createNFT();

