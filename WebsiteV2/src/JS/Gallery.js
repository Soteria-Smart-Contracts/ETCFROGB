let NFTContainer = document.getElementById('NFTList')
let LastLoaded = 1;

const Doubles = [
    4823, 1226, 4674, 5080, 9776, 994, 7763, 1018, 8748,
    3957, 2802, 3925, 6645, 1351, 7450, 5027, 7495, 938, 662,
    9117, 909, 6882, 7754, 8576, 1871, 3507, 8162, 8746, 4230,
    8963, 5328, 2609, 2355, 6710, 2039, 8707, 6159, 2883, 7268,
    1688, 4275, 5580, 1680, 9841, 993, 6467, 4012, 7436, 4210,
    5637, 4164, 5470, 5803, 8954, 4385, 2990, 99, 3372, 8611,
    7522, 3809, 179, 125, 5971, 1432, 2307, 1589, 357, 7599,
    9220, 9655, 920, 1989, 8463, 4629, 3910, 302, 3105, 4969,
    4202, 4215, 2972, 7939, 2361, 3080, 1471, 3923, 5252, 4182,
    6801, 3278, 8131, 5021, 9544, 677, 7888, 7950, 3579, 6368,
    1990, 1729, 8700, 8904, 1410, 9940, 9553, 8898, 490, 2577,
    3779, 9303, 300, 4014, 7099, 5155, 2605
];

LoadGallery();

async function LoadGallery(){
    let LastToLoad = LastLoaded + 50;
    while(LastLoaded < LastToLoad){
        DisplayNFT(LastLoaded)
        LastLoaded++;
    }
}

//load doubles



async function DisplayNFT(ID){
    NewNFT = document.createElement("div");
    NewNFT.className = 'NFT'
    NewNFT.id = ID;
    let img = '<img class="nftimage" src="https://etcfrogb.mypinata.cloud/ipfs/QmdHWsMWde4UCTiQJojN2ed3rBmxFAsjQkKZDi4dCZZB3F/' + ID + '.png">'
    let ScoutLink = 'https://blockscout.com/etc/mainnet/token/0x5925630e4D0AB569A40E600064Da2930b4838Da3/instance/' + ID +  '/token-transfers';
    NewNFT.innerHTML = img + '<br>' + '<a class="nftID">FrogB ID:</a>' + '<br>' + '<a class="nftID">' + ID + '</a>';
    NFTContainer.appendChild(NewNFT);
}