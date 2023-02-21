MintButton = document.getElementById('MintButton')
WalletButton = document.getElementById('Wallet')




async function DisplayLoggedIn(){
    MintButton.innerText = "Mint";
    MintButton.onclick = object.onclick = function(){mint()};
    WalletButton.innerText = "Connected"
}