let account;
const ABI = window.abi;
let netID;
const contractAddress = "0x5925630e4D0AB569A40E600064Da2930b4838Da3";
let LoggedIn = false;

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
        getsupply();
        DisplayLoggedIn();
        console.log('Logged In')
        LoggedIn = true;
    } else { 
        alert("No ETHER Wallet available")
    }
    }
}

async function getsupply(){
    supply = await contract.methods.totalSupply().call();
    document.getElementById("Minted").innerHTML = supply;
}

async function getID(){
    let idhex = web3.eth._provider.chainId;
    netID = parseInt(idhex, 16);

    return(netID);
}

async function mint(){
    let amount = document.getElementById("Input").value;
    if(amount == 0 || amount > 100){
        alert("Amount to mint must be greater than 0 and less than 101")
        return('Error Thrown')
    }
    let amountWei = amount * 2000000000000000000;
    let userbal = await web3.eth.getBalance(account);
    if(amountWei > userbal){
        alert("Insufficient ETC to buy this number of Bogs")
        return('Error Thrown')
    }
    let gas = await contract.methods.mint(amount).estimateGas({from: account});
    let tx = await contract.methods.mint(amount).send({from: account, value: amountWei, gas: gas});
}