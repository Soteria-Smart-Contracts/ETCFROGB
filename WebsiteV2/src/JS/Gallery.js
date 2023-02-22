let NFTContainer = document.getElementById('NFTList')
let LastLoaded = 1;


async function LoadGallery(){
    let LastToLoad = LastLoaded + 50;
    while(LastLoaded <= LastToLoad){
        DisplayNFT(LastLoaded++)
    }
}





async function DisplayNFT(ID){
    NewNFT = document.createElement("div");
    NewNFT.className = 'NFT'
    NewNFT.id = ID;
    let img = '<img class="nftimage" src="https://ipfs.io/ipfs/QmdHWsMWde4UCTiQJojN2ed3rBmxFAsjQkKZDi4dCZZB3F/' + ID + '.png">'
    let ScoutLink = 'https://blockscout.com/etc/mainnet/token/0x5925630e4D0AB569A40E600064Da2930b4838Da3/instance/' + ID +  '/token-transfers';
    NewNFT.innerHTML = img + '<br>' + '<a class="nftID">FrogB ID:</a>' + '<br>' + '<a class="nftID">' + ID + '</a>';
    NFTContainer.appendChild(NewNFT);
}