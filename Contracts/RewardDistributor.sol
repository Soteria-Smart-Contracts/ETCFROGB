// SPDX-License-Identifier: UNLICENSE
//The code is the documentation ♥
pragma solidity ^0.8.17;

abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}

contract NFTRewardDistributor is ReentrancyGuard{
    //Variable Declarations
    uint256 public Owner;
    address public NFTcontract;
    uint256 public TotalEtherInRewards;
    RewardInstance[] public RewardInstances;
    uint256[] public AllRegisteredTokens;
    mapping(uint256 => uint256) public AllRegisteredTokensIndex;
    mapping(uint256 => uint256) public RegistrationTimeUnix;

    //Mapping, structs, enums and other declarations
    mapping(uint256 => uint256) public LatestClaim;
    mapping(address => uint256) public UserTotalClaimed;
    mapping(uint256 => bool) internal FirstClaimComplete;

    mapping(address => uint256[]) public UserRegisteredTokens;
    mapping(address => mapping(uint256 => uint256)) public UserRegisteredTokensIndex;

    mapping(uint256 => bool) public TokenRegistered;

    event ClaimedAllRewards(uint256 TotalReward, address User);
    event NewInstanceCreated(RewardInstance NewInstanceDetails);

    struct RewardInstance{
        uint256 TimeStamp;
        uint256 InstanceIdentifier;
        uint256 TotalEther;
        uint256 EtherReward;
        uint256[] RegisteredTokensAtInstance;
    }

    //On Deploy code to run (Constructor)
    constructor(address _NFTcontract, uint256 _MinimumToReward){
        NFTcontract = _NFTcontract;
    }

    function registerAllNFTs() public {
        cleanRegisteredNFTs();
        uint256[] memory tokens = ERC721(NFTcontract).walletOfOwner(msg.sender);

        for (uint256 index; index < tokens.length; index++){
            if(TokenRegistered[tokens[index]] == false){
                UserRegisteredTokens[msg.sender].push(tokens[index]);
                UserRegisteredTokensIndex[msg.sender][tokens[index]] = UserRegisteredTokens[msg.sender].length;
                TokenRegistered[tokens[index]] = true;

                AllRegisteredTokens.push(tokens[index]);
                AllRegisteredTokensIndex[tokens[index]] = AllRegisteredTokens.length;

                RegistrationTimeUnix[tokens[index]] = block.timestamp;
                LatestClaim[tokens[index]] = (RewardInstances.length - 1);
            }
        }
    }
    
    //Public functions
    function GetTotalUnclaimed(address user) public view returns(uint256 Unclaimed){
        uint256 TotalUnclaimed;
        uint256[] memory Tokens = UserRegisteredTokens[user];

        for(uint256 index; index < Tokens.length; index++){
            if(LatestClaim[Tokens[index]] != (RewardInstances.length - 1) || LatestClaim[Tokens[index]] == 0){
                uint256 Instance;
                if(FirstClaimComplete[Tokens[index]] == false){
                    Instance = 0;
                }
                else{
                    Instance = LatestClaim[Tokens[index]] + 1;
                }
                for(Instance; Instance < RewardInstances.length; Instance++){
                    TotalUnclaimed = (TotalUnclaimed + RewardInstances[Instance].EtherReward);
                }
            }
        }
        return(TotalUnclaimed);
    }

    function ClaimAllRewards() public nonReentrant returns(uint256 TotalRewardOutput){
        cleanRegisteredNFTs();

        uint256 TotalReward;
        uint256[] memory Tokens = UserRegisteredTokens[msg.sender];
        require(Tokens.length > 0, "You do not own any rewardable NFTs");

        for(uint256 index; index < Tokens.length; index++){
            if(LatestClaim[Tokens[index]] != (RewardInstances.length - 1) || LatestClaim[Tokens[index]] == 0){
                uint256 Instance;
                if(FirstClaimComplete[Tokens[index]] == false){
                    Instance = 0;
                    FirstClaimComplete[Tokens[index]] = true;
                }
                else{
                    Instance = LatestClaim[Tokens[index]] + 1;
                }
                for(Instance; Instance < RewardInstances.length; Instance++){
                    TotalReward = (TotalReward + RewardInstances[Instance].EtherReward);
                }
            }
            LatestClaim[Tokens[index]] = (RewardInstances.length - 1);
        }

        require(TotalReward > 1, "You do not have any ETC to claim!");
        TotalEtherInRewards = (TotalEtherInRewards - TotalReward);
        UserTotalClaimed[msg.sender] = UserTotalClaimed[msg.sender] + TotalReward;
        (payable(msg.sender)).transfer(TotalReward);

        emit ClaimedAllRewards(TotalReward, msg.sender);
        return(TotalReward);
    }

    //Internal functions
    function InitializeRewardInstance() public OnlyOwner{
        uint256 NewIdentifier = RewardInstances.length;

        uint256 TotalEther = (address(this).balance - TotalEtherInRewards);
        uint256 EtherReward = (TotalEther / AllRegisteredTokens.length);

        RewardInstance memory NewInstance = RewardInstance(block.timestamp, NewIdentifier, TotalEther, EtherReward, AllRegisteredTokens);
        RewardInstances.push(NewInstance);
        TotalEtherInRewards = TotalEtherInRewards + TotalEther;

        emit NewInstanceCreated(NewInstance);
    }

    //create a function that checks all user registered nft and if it is still owned by the user, if not remove it from the array, call this function cleanRegisteredNFTs
    function cleanRegisteredNFTs() internal{
        uint256[] memory Tokens = UserRegisteredTokens[msg.sender];
        
        for(uint256 index; index < Tokens.length; index++){
            if(ERC721(NFTcontract).ownerOf(Tokens[index]) != msg.sender){
                UserRegisteredTokens[msg.sender][index] = UserRegisteredTokens[msg.sender][UserRegisteredTokens[msg.sender].length - 1];
                UserRegisteredTokens[msg.sender].pop();
                TokenRegistered[Tokens[index]] = false;

                AllRegisteredTokens[AllRegisteredTokensIndex[Tokens[index]]] = AllRegisteredTokens[AllRegisteredTokens.length - 1];
                AllRegisteredTokens.pop();
            }
        }
    }

    receive() external payable {
    }
}

interface ERC721{
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function walletOfOwner(address owner) external view returns(uint256[] memory IDs);
    function maxSupply() external view returns(uint256);
}