let account;
const ABI = window.abi;
const contractAddress = "0x493fD82D18a17cF90a357aaD6A4c5B3D352427b0";

loginWithEth();


async function loginWithEth(){
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
    } else {
        alert("No ETHER Wallet available")
    }
}

async function getID(){
    let idhex = web3.eth._provider.chainId;
    netID = parseInt(idhex, 16);

    return(netID);
}

async function mint(){
    let amount = document.getElementById("amount").value;
    let amountWei = amount * 1000000000000000000;
    let tx = await contract.methods.mint(amountWei).send({from: account});
    console.log(tx);
    return(tx);
}