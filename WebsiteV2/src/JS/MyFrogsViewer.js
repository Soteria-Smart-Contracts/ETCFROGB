let account;
const ABI = window.abi;
let netID;
const contractAddress = "0x5925630e4D0AB569A40E600064Da2930b4838Da3";
let LoggedIn = false;
let NFTs = [];


let WalletButton = document.getElementById('Wallet');
let NFTContainer = document.getElementById('NFTList')
loginWithEth();

async function loginWithEth(){
    if(LoggedIn == false){
    if(window.ethereum){
        await ethereum.request({ method: 'eth_requestAccounts' });
        window.web3 = await new Web3(ethereum);
        await getID();
        if (netID != 61){
            console.log("The current Metamask/Web3 network is not Ethereum Classic, please connect to the Ropsten test network."); //CHANGE FOR REAL CROWDSALE TO ETC
            alert("The current Metamask/Web3 network is not Ropsten, please connect to the Ethereum Classic test network.");
            showOverlay();
            return("Failed to connect")
        }
        accountarray = await web3.eth.getAccounts();
        contract = new window.web3.eth.Contract(ABI, contractAddress, window.web3);
        account = accountarray[0];
        WalletButton.innerText = "Connected";
        console.log('Logged In');
        LoggedIn = true;
        GetUserNFTs();
    } else { 
        alert("No ETHER Wallet available")
    }
    }
}

async function getID(){
    let idhex = web3.eth._provider.chainId;
    netID = parseInt(idhex, 16);

    return(netID);
}

async function GetUserNFTs(){
    NFTs = await contract.methods.walletOfOwner(account).call();
    let index = 0;
    while(index < NFTs.length){
        DisplayNFT(NFTs[index]);
        index++;
    }

}

async function DisplayNFT(ID){
    NewNFT = document.createElement("div");
    NewNFT.className = 'NFT'
    NewNFT.id = ID;
    let img = '<img class="nftimage" src="https://cloudflare-ipfs.com/ipfs/QmdHWsMWde4UCTiQJojN2ed3rBmxFAsjQkKZDi4dCZZB3F/' + ID + '.png">'
    let ScoutLink = 'https://blockscout.com/etc/mainnet/token/0x5925630e4D0AB569A40E600064Da2930b4838Da3/instance/' + ID +  '/token-transfers';
    NewNFT.innerHTML = img + '<br>' + '<a class="nftID">FrogB ID:</a>' + '<br>' + '<a class="nftID">' + ID + '</a>' + '<br>' + '<a class="nftID scout" href="' + ScoutLink + '" target="_blank">View On Blockscout</a>';
    NFTContainer.appendChild(NewNFT);
}

{/* <div class="NFT" id="Temp">
<img class="nftimage" src="src/images/collection/1445.png">
<a class="nftID head">FrogB ID:</a>
<br><a class="nftID">0</a>
<br><a class="nftID scout" href="https://blockscout.com/etc/mainnet/token/0x2001d679210c0e4531f5c07155d8e3677dd388ae/instance/1445/token-transfers" target="_blank">View On Blockscout</a>
</div> */}
