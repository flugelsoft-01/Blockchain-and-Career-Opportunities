# Chapter 7: Hands-on Learning: Writing Solidity & Building Simple dApps

Reading theory is good, but the only way to truly learn programming is by writing code. In this chapter, we will write our very first smart contract in Solidity, and then build a simple HTML page to interact with it.

---

## 7.1 Solidity Basics: State and Functions

Before we code, let's understand three basic concepts of a Solidity smart contract:
1.  **SPDX License Identifier:** The very first line of any Solidity file specifies the open-source license under which the code is published (e.g., MIT).
2.  **Pragma Version:** Tells the compiler which version of Solidity to use.
3.  **State Variables:** Variables stored permanently in the blockchain storage. Reading these is free, but modifying them costs gas.

---

## 7.2 Writing Your First Contract: `SimpleStorage`

Here is a simple contract that stores a message and lets users update it.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleStorage {
    // 1. State variable to store our message on the blockchain
    string private message;

    // 2. Event to notify external systems when the message changes
    event MessageChanged(string newMessage);

    // 3. Constructor to set the initial message when deployed
    constructor(string memory initialMessage) {
        message = initialMessage;
    }

    // 4. A read-only function to get the message (free to call)
    function getMessage() public view returns (string memory) {
        return message;
    }

    // 5. A function that modifies the blockchain state (costs gas)
    function setMessage(string memory newMessage) public {
        message = newMessage;
        emit MessageChanged(newMessage);
    }
}
```

### Let's Break Down the Code:
*   `pragma solidity ^0.8.20;` tells the compiler to compile using Solidity version 0.8.20 or newer.
*   `string private message;` declares a private text variable stored permanently on the blockchain.
*   `constructor` runs exactly once when the contract is created, letting us set a starting message.
*   `public view` in `getMessage()` specifies that this function only reads data. Because it doesn't write anything, anyone can call it for free without paying gas.
*   `setMessage()` changes the state variable. Because it writes to the blockchain, the user calling it must sign the transaction and pay a small gas fee.

---

## 7.3 Building a Simple dApp (Decentralized Application)

A smart contract on its own lives on the blockchain. To make it a **dApp**, we need to build a user interface (frontend) that connects to it.

![dApp Workflow Flow Infographic](./assets/dapp_architecture.jpg)

Here is a simple HTML and JavaScript frontend using the `ethers.js` library to let users view and update the message in our contract.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My First dApp</title>
    <!-- Include Ethers.js library from a CDN -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.umd.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background-color: #f4f6f9; }
        .container { background: white; padding: 30px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        button { background-color: #6366f1; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 16px; margin: 10px 0; }
        button:hover { background-color: #4f46e5; }
        input { padding: 10px; width: 80%; border-radius: 5px; border: 1px solid #ccc; font-size: 16px; }
    </style>
</head>
<body>

<div class="container">
    <h2>Simple Storage dApp</h2>
    <button id="connectBtn" onclick="connectWallet()">Connect Wallet</button>
    <p id="walletAddress"></p>

    <hr>

    <h3>Current Message: <span id="currentMsg">Loading...</span></h3>
    <button onclick="fetchMessage()">Refresh Message</button>

    <hr>

    <input type="text" id="newMsgInput" placeholder="Enter new message...">
    <br>
    <button onclick="updateMessage()">Update Message on Blockchain</button>
</div>

<script>
    let provider;
    let signer;
    let contract;

    // Replace with your deployed contract address and ABI
    const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
    const contractABI = [
        "function getMessage() public view returns (string memory)",
        "function setMessage(string memory newMessage) public"
    ];

    async function connectWallet() {
        if (window.ethereum) {
            provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = await provider.getSigner();
            const address = await signer.getAddress();
            document.getElementById("walletAddress").innerText = `Connected: ${address}`;
            document.getElementById("connectBtn").innerText = "Connected";
            
            // Connect to contract
            contract = new ethers.Contract(contractAddress, contractABI, signer);
            fetchMessage();
        } else {
            alert("Please install MetaMask wallet!");
        }
    }

    async function fetchMessage() {
        if (!contract) return;
        const msg = await contract.getMessage();
        document.getElementById("currentMsg").innerText = msg;
    }

    async function updateMessage() {
        if (!contract) return;
        const newMsg = document.getElementById("newMsgInput").value;
        const tx = await contract.setMessage(newMsg);
        document.getElementById("currentMsg").innerText = "Updating... Please wait";
        await tx.wait(); // Wait for transaction to be mined
        fetchMessage();
    }
</script>
</body>
</html>
```

### How the Frontend Connects to the Blockchain:
1.  `window.ethereum` detects if a crypto wallet (like MetaMask) is installed in the user's browser.
2.  `ethers.BrowserProvider(window.ethereum)` creates a connection to the blockchain via MetaMask.
3.  `provider.getSigner()` requests the user's permission to sign transactions using their private key.
4.  `ethers.Contract(contractAddress, contractABI, signer)` instances the contract so Javascript can call functions like `getMessage()` and `setMessage()` as if they were local functions!

---

## 🔑 Chapter Summary
Congratulations! You've taken your first step into writing smart contracts.
1.  You learned about Solidity state variables and constructor methods.
2.  You saw how `view` functions are free, while functions modifying state cost gas.
3.  You saw how standard web HTML/JS connects to MetaMask and smart contracts using the Ethers.js library.

In the next chapter, we will discuss how you can build on this knowledge to create impressive portfolio projects that will catch the eye of top Web3 employers.
