let account;
const ABI = window.abi;
let netID;
const contractAddress = "0x5925630e4D0AB569A40E600064Da2930b4838Da3";
const rewardAddress = "0x03Ccdf91140A5350759Fd5Df56D9D2c47b91125F";
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
            console.log("The current Metamask/Web3 network is not Ethereum Classic, please connect to the Ethereum Classic test network."); //CHANGE FOR REAL CROWDSALE TO ETC
            alert("The current Metamask/Web3 network is not Ethereum Classic, please connect to the Ethereum Classic test network.");
            showOverlay();
            return("Failed to connect")
        }
        accountarray = await web3.eth.getAccounts();
        contract = new window.web3.eth.Contract(ABI, contractAddress, window.web3);
        rewardcontract = new window.web3.eth.Contract(rewardabi, rewardAddress, window.web3);
        account = accountarray[0];
        WalletButton.innerText = "Connected";
        console.log('Logged In');
        LoggedIn = true;
        GetUserNFTs();
        UpdateTotalEarned();
        UpdateUnclaimedRewards();
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
        await DisplayNFT(NFTs[index]);
        index++;
    }

}

//register all nfts using registerAllNFTs()
async function register(){
    let gas = await rewardcontract.methods.registerAllNFTs().estimateGas({from: account});
    let tx = await rewardcontract.methods.registerAllNFTs().send({from: account, gas: gas});
    console.log(tx);
    UpdateTotalEarned();
    location.reload();
}

async function UpdateTotalEarned(){
    let total = await rewardcontract.methods.UserTotalClaimed(account).call();

    total = web3.utils.fromWei(total, 'ether');
    total = parseFloat(total).toFixed(2);

    total = total.toString()
    console.log(total);
    document.getElementById("totalearned").innerText = total;
}

//Unclaimed Rewards update
async function UpdateUnclaimedRewards(){
    let total = await rewardcontract.methods.GetTotalUnclaimed(account).call();

    total = web3.utils.fromWei(total, 'ether');
    total = parseFloat(total).toFixed(2);

    total = total.toString()
    console.log(total);
    document.getElementById("unclaimed").innerText = total;
}

async function ClaimRewards(){
    let gas = await rewardcontract.methods.ClaimAllRewards().estimateGas({from: account});
    let tx = await rewardcontract.methods.ClaimAllRewards().send({from: account, gas: gas});
    console.log(tx);
    UpdateTotalEarned();
}


async function isTokenRegistered(tokenID) {
    return await rewardcontract.methods.IsTokenRegistered(tokenID).call({ from: account });
}

async function DisplayNFT(ID){
    NewNFT = document.createElement("div");
    NewNFT.className = 'NFT'
    NewNFT.id = ID;
    let IsRegistered = await isTokenRegistered(ID);

    if(IsRegistered == true){
        IsRegistered = 'Registered';
    } else {
        IsRegistered = 'Not Registered';
    }

    let img = '<img class="nftimage" src="https://etcfrogb.mypinata.cloud/ipfs/QmdHWsMWde4UCTiQJojN2ed3rBmxFAsjQkKZDi4dCZZB3F/' + ID + '.png">'
    let ScoutLink = 'https://blockscout.com/etc/mainnet/token/0x5925630e4D0AB569A40E600064Da2930b4838Da3/instance/' + ID +  '/token-transfers';
    NewNFT.innerHTML = img + '<br>' + '<a class="nftID">FrogB ID:</a>' + '<br>' + '<a class="nftID">' + ID + '</a>' + '<br>' + '<a class="nftID scout" href="' + ScoutLink + '" target="_blank">View On Blockscout</a>' + '<br>' + '<a class="nftID">' + IsRegistered + '</a>';
    NFTContainer.appendChild(NewNFT);
}


{/* <div class="NFT" id="Temp">
<img class="nftimage" src="src/images/collection/1445.png">
<a class="nftID head">FrogB ID:</a>
<br><a class="nftID">0</a>
<br><a class="nftID scout" href="https://blockscout.com/etc/mainnet/token/0x2001d679210c0e4531f5c07155d8e3677dd388ae/instance/1445/token-transfers" target="_blank">View On Blockscout</a>
</div> */}
