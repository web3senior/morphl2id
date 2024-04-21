// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import "./_ownable.sol";
import "./_pausable.sol";
import "./_error.sol";
import "./_lib.sol";

library StringUtils {
    function toLower(string memory str) external pure returns (string memory) {
        bytes memory bStr = bytes(str);
        bytes memory lowerCaseStr = new bytes(bStr.length);
        for (uint256 i = 0; i < bStr.length; i++) {
            // Convert uppercase characters to lowercase
            if (uint8(bStr[i]) >= 65 && uint8(bStr[i]) <= 90) {
                lowerCaseStr[i] = bytes1(uint8(bStr[i]) + 32);
            } else {
                lowerCaseStr[i] = bStr[i];
            }
        }
        return string(lowerCaseStr);
    }
}

/// @title MorphL2 Name Service
/// @author Aratta Labs
/// @notice
/// @dev You can find deployed contract addresses in the README.md file
/// @custom:security-contact atenyun@gmail.com
contract MNS is Ownable(msg.sender), Pausable, ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter public _recordTypeCounter;
    Counters.Counter public _resolveCounter;
    Counters.Counter private _tokenIds;
    string public URL;
    string public defaultMetadata;
    uint8 constant commission = 5;
    string private baseURI = "https://aratta.me/morph-nft/";

    // Events
    event newDomain(bytes32 node);
    event renewDomain(bytes32 node);
    event Log(string func, uint256 gas);
    event NewExtension(bytes32 id);
    event RecordTypeAdded(bytes32 indexed id, string name);
    event RecordTypeUpdated(bytes32 indexed id, string name);
    event ResolveUpdated(address indexed manager, string metadata);

    // e.g. .morph, .wallet
    struct RecordType {
        bytes32 id;
        string name;
        uint256 price;
        string[] reserved;
        string metadata;
        uint256 dt;
        bool pause;
    }

    RecordType[] public recordTypes;

    struct NameListStruct {
        bytes32 id;
        string name;
    }

    struct ResolveStruct {
        bytes32 recordTypeId;
        bytes32 nodehash;
        string metadata;
        address manager;
        uint256 exp;
    }

    ResolveStruct[] public resolve;

    mapping(bytes32 => mapping(bytes32 => string)) public blockStorage;

    ///@dev Throws if called by any account other than the manager.
    modifier onlyManager(bytes32 nodehash) {
        uint256 resolveIndex = _indexOfResolve(nodehash);
        require(resolve[resolveIndex].manager == msg.sender, "The sender is not the manager of the entered nodehash.");
        _;
    }

    constructor() ERC721("MorphName", "MNS") {
        URL = "www.morphl2.id";
        defaultMetadata = "QmdyTWBLkg1B4NDHBMaxJHCQ9VpXDvLu8h7ZAGpGHmoN5y";

        string[] memory reserved = new string[](1);
        reserved[0] = "sdf";

        _recordTypeCounter.increment();
        recordTypes.push(RecordType(bytes32(_recordTypeCounter.current()), StringUtils.toLower("morph"), 10000000000000, reserved, "", block.timestamp, false));
        emit RecordTypeAdded(bytes32(_recordTypeCounter.current()), StringUtils.toLower("morph"));

        _recordTypeCounter.increment();
        recordTypes.push(RecordType(bytes32(_recordTypeCounter.current()), StringUtils.toLower("wallet"), 10000000000000, reserved, "", block.timestamp, false));
        emit RecordTypeAdded(bytes32(_recordTypeCounter.current()), StringUtils.toLower("wallet"));

        _recordTypeCounter.increment();
        recordTypes.push(RecordType(bytes32(_recordTypeCounter.current()), StringUtils.toLower(unicode"🐨"), 10000000000000, reserved, "", block.timestamp, false));
        emit RecordTypeAdded(bytes32(_recordTypeCounter.current()), StringUtils.toLower(unicode"🐨"));
    }

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {
        emit Log("fallback", gasleft());
    }

    function toLowercase(string memory _arg) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_arg)) >> 32;
    }

    /// @notice Store a new key/ value
    function setKey(
        bytes32 appId,
        bytes32 key,
        string memory val
    ) public onlyOwner {
        blockStorage[appId][key] = val;
    }

    /// @notice Get the stored value
    /// @param appId The bytes32 ID
    /// @param key A byte32 key
    /// @return value in CID format
    function getKey(bytes32 appId, bytes32 key) public view returns (string memory) {
        return blockStorage[appId][key];
    }

    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
    }

    /// @notice Delete a key from the storage
    /// @param appId The bytes32 ID
    /// @param key A byte32 key
    /// @return boolean
    function delKey(bytes32 appId, bytes32 key) public onlyOwner returns (bool) {
        delete blockStorage[appId][key];
        return true;
    }

    /// @notice Update URL
    function updateUrl(string memory url) public onlyOwner {
        URL = url;
    }

    /// @notice Update default Metadata
    function updateDefaultMetadata(string memory metadata) public onlyOwner {
        defaultMetadata = metadata;
    }

    function setRecordType(
        string memory _name,
        uint256 _price,
        string[] memory _reserved,
        string memory _metadata,
        bool _pause
    ) public onlyOwner {
        _recordTypeCounter.increment();
        recordTypes.push(RecordType(bytes32(_recordTypeCounter.current()), StringUtils.toLower(_name), _price, _reserved, _metadata, block.timestamp, _pause));
        emit RecordTypeAdded(bytes32(_recordTypeCounter.current()), "morph");
    }

    /// @notice Update URL
    function updateRecordType(
        bytes32 _recordTypeId,
        string memory _name,
        uint256 _price,
        string[] memory _reserved,
        string memory _metadata,
        bool _pause
    ) public onlyOwner {
        uint256 _recordTypesId = _indexOfRecordType(_recordTypeId);
        recordTypes[_recordTypesId].name = StringUtils.toLower(_name);
        recordTypes[_recordTypesId].price = _price;
        recordTypes[_recordTypesId].reserved = _reserved;
        recordTypes[_recordTypesId].metadata = _metadata;
        recordTypes[_recordTypesId].pause = _pause;
        emit RecordTypeUpdated(bytes32(_recordTypeCounter.current()), "morph");
    }

    /// @notice Update URL
    function updateResolve(
        bytes32 _nodehash,
        address _manager,
        string memory _metadata
    ) public onlyManager(_nodehash) {
        uint256 _resolveId = _indexOfResolve(_nodehash);
        resolve[_resolveId].manager = _manager;
        resolve[_resolveId].metadata = _metadata;
        emit ResolveUpdated(_manager, _metadata);
    }

    function getRecordTypeList() public view returns (RecordType[] memory) {
        return recordTypes;
    }

    function getRecordTypeListName() public view returns (NameListStruct[] memory) {
        NameListStruct[] memory _nameList = new NameListStruct[](recordTypes.length);
        for (uint256 i = 0; i < recordTypes.length; i++) {
            _nameList[i] = NameListStruct(recordTypes[i].id, recordTypes[i].name);
        }
        return _nameList;
    }

    function getRecordType(bytes32 _recordTypeId) public view returns (RecordType memory result) {
        for (uint256 i = 0; i < recordTypes.length; i++) if (recordTypes[i].id == _recordTypeId) return recordTypes[i];
        revert("Record Type Not Found");
    }

    function getDomainList(address _manager) public view returns (ResolveStruct[] memory list) {
        ResolveStruct[] memory ManagerDomainList = new ResolveStruct[](resolve.length);
        uint256 counter = 0;
        for (uint256 i = 0; i < recordTypes.length; i++) {
            if (resolve[i].manager == _manager) {
                ManagerDomainList[counter] = resolve[i];
                counter++;
            }
        }
        return ManagerDomainList;
    }

    /// @notice Verify a record type
    /// @param _recordTypeId A byte32 key
    /// @return boolean
    function isExistRecordType(bytes32 _recordTypeId) public view returns (bool) {
        for (uint256 i = 0; i < recordTypes.length; i++) if (recordTypes[i].id == _recordTypeId) return true;
        return false;
    }

    /// @dev Retrieve the index of the app
    /// @param _recordTypeId bytes32
    /// @return uint256
    function _indexOfRecordType(bytes32 _recordTypeId) internal view returns (uint256) {
        for (uint256 i = 0; i < recordTypes.length; i++) if (recordTypes[i].id == _recordTypeId) return i;
        revert("Record Type Not Found");
    }

    function _indexOfResolve(bytes32 _nodehash) internal view returns (uint256) {
        for (uint256 i = 0; i < resolve.length; i++) if (resolve[i].nodehash == _nodehash) return i;
        revert("Resolve Not Found");
    }

    function isFreeToRegister(bytes32 _nodehash) external view returns (bool) {
        for (uint256 i = 0; i < resolve.length; i++) if (resolve[i].nodehash == _nodehash) return false;
        return true;
    }

    // Check if the name is duplicated if it's not expired
    function _checkDuplicatedName(bytes32 _nodehash) internal returns (bool) {
        for (uint256 i = 0; i < resolve.length; i++) {
            if (resolve[i].nodehash == _nodehash && resolve[i].exp > block.timestamp) {
                delete resolve[i]; //delete the expired domain
                return true;
            }
        }
        return false;
    }

    /// atenyun.morph => 0x7d86081aaf35ccbf3aa9d8f502599bfcc262c01659f2750e2b847f842c8ccafe
    /// .morph => 0x0000000000000000000000000000000000000000000000000000000000000001

    function register(string memory _name, bytes32 _recordTypeId) public payable whenNotPaused returns (bytes32, uint256) {
        // Get recordTypesIndex
        uint256 _recordTypesId = _indexOfRecordType(_recordTypeId);

        // Check the amount
        if (msg.sender != owner()) {
            if (msg.value < recordTypes[_recordTypesId].price) revert PriceNotMet(recordTypes[_recordTypesId].price, msg.value);
        }

        // Check if the name is duplicated if it's not expired
        bytes32 nodehash = bytes32(keccak256(bytes.concat(bytes(StringUtils.toLower(_name)), bytes("."), bytes(recordTypes[_recordTypesId].name))));

        require(!_checkDuplicatedName(nodehash), "duplicated");

        // Buy it
        resolve.push(ResolveStruct(_recordTypeId, nodehash, defaultMetadata, msg.sender, (block.timestamp + 360 days)));
        emit newDomain(nodehash);

        _resolveCounter.increment();

        _tokenIds.increment();
        // Mint MNS NFT
        uint256 newItemId = _tokenIds.current();
        // string memory tokenURI = "";
        _mint(msg.sender, newItemId);
        // Set default MNS asset

        _setTokenURI(newItemId, tokenURI(newItemId));

        return (nodehash, newItemId);
    }

    /// everyone can renew a domain! or add onlyManager
    function renew(bytes32 _nodehash, bytes32 _recordTypeId) public payable returns (bytes32) {
        // Get recordTypesIndex
        uint256 _recordTypesId = _indexOfRecordType(_recordTypeId);

        // Get resolve index
        uint256 _resolveIndex = _indexOfResolve(_nodehash);

        // Check the amount
        /// owner can renew a domain without spending $
        if (msg.sender != owner()) {
            if (msg.value < recordTypes[_recordTypesId].price) revert RenewPriceNotMet(recordTypes[_recordTypesId].price, msg.value);
        }

        // update the expiration 1 year value
        resolve[_resolveIndex].exp = (block.timestamp + 360 days);

        emit renewDomain(_nodehash);

        _resolveCounter.increment();

        return _nodehash;
    }

    //uint256 tokenId
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // return string(string.concat(baseURI, Strings.toString(tokenId), ".json"));
        return string(string.concat(baseURI, "main.json"));

        // bytes memory rawSVG = abi.encodePacked('<svg width="1080" height="1080" viewBox="0 0 1080 1080" fill="none" xmlns="http://www.w3.org/2000/svg"> <rect width="1080" height="1080" fill="#0F100E"/> <text x="40" y="35" class="heavy">.morph</text> </svg>');
        // string memory embededSVG = string.concat("data:image/svg+xml;base64,", Base64.encode(rawSVG));
        // string memory json = string.concat(
        //     '{ "name": "Morph Naming Service", "description": "Morph Naming Services (MNS) is decentralized, more secure, gives users ownership of their domains, and allows memorable names for easier transactions.", "image": "',
        //     embededSVG,
        //     '", "exp": "360 days" }'
        // );
        // return string.concat("data:application/json;utf8,", json);
    }

    // function contractURI() public pure returns (string memory) {
    //     string
    //         memory json = '{ "name": "Morph Naming Service", "description": "Morph Naming Services (MNS) is decentralized, more secure, gives users ownership of their domains, and allows memorable names for easier transactions.", "image": "https://ipfs.io/ipfs/QmfPYe78mi9jwC67GbYb3vhMZNAA4mWpA7Z4PxgdtJ2AuU", "exp": "360 days" }';
    //     return string.concat("data:application/json;utf8,", json);
    // }

    function resolver(bytes32 nodehash) public view returns (ResolveStruct memory) {
        for (uint256 i = 0; i < resolve.length; i++)
            if (resolve[i].nodehash == nodehash) {
                // Check if the domain isn't expired
                if (block.timestamp < resolve[i].exp) return resolve[i];
            }
        revert Reverted();
    }

    /// Domains tidy up by any users!
    function domainTidyUp() public {
        for (uint256 i = 0; i < resolve.length; i++)
            // Check if the domain isn't expired
            if (block.timestamp > resolve[i].exp) {
                delete resolve[i];
                ///emit that a domain deleted...and is free to register
            }
    }

    // Function to withdraw all Ether from this contract.
    function withdraw() public onlyOwner {
        // get the amount of Ether stored in this contract
        uint256 amount = address(this).balance;

        // send all Ether to owner
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Failed");
    }

    // // Function to transfer Ether from this contract to address from input
    function transferBalance(address payable _to, uint256 _amount) public onlyOwner {
        // Note that "to" is declared as payable
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Failed");
    }

    /// @notice Get contract's balance
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
}
