import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers"; // Import ethers.js
import { useWeb3React } from "@web3-react/core";
import {
  Button,
  Box,
  Text,
  Input,
  Switch,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { useDisclosure, useToast } from "@chakra-ui/react";
import { injected } from "../config/wallets";
import abi from "./abi.json";
declare global {
  interface Window {
    ethereum: any;
  }
}
export default function ConnectButton() {
  const { account, active, activate, deactivate } = useWeb3React(); // Renamed 'deactivate' function
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [connected, setConnected] = useState<boolean>(false);
  const [balance, setBalance] = useState<string>("0");
  const [babyBalance, setBabyBalance] = useState<string>("0");
  const [mode, setMode] = useState<string>("BNB");
  const [recieverAdd, setRecieverAdd] = useState<string>("");
  const [sendAmount, setSendAmount] = useState<string>("0"); // Changed to string
  const [gasFee, setGasFee] = useState<string>("");
  const [gasLimit, setGasLimit] = useState('');
  const toast = useToast();
  async function handleConnectWallet() {
    if (!connected) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      try {
        await provider.send("eth_requestAccounts", []);
        activate(injected, (error) => {
          if (error) {
            console.error("Failed to activate:", error);
          }
        });
        setConnected(true);
      } catch (error) {
        console.error("Failed to connect:", error);
      }
    } else {
      deactivate();
      setConnected(false);
    }
  }
  function handleMode() {
    setMode(mode === "BNB" ? "BabyDoge" : "BNB");
  }
  function handleChangeAddress(event: React.ChangeEvent<HTMLInputElement>) {
    setRecieverAdd(event.target.value);
  }
  function handleChangeAmount(event: React.ChangeEvent<HTMLInputElement>) {
    setSendAmount(event.target.value);
  }
  async function handleOpenModal() {
    if (!recieverAdd) {
      return toast({
        description: "Please input Receiver Address",
        status: "error",
      });
    }
    if (!sendAmount || sendAmount === "0") {
      return toast({
        description: "Please input send amount",
        status: "error",
      });
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const gasLimitResponse = await provider.estimateGas({
      to: recieverAdd,
      value: ethers.utils.parseEther(sendAmount), // Convert to wei
    });
    setGasLimit(gasLimitResponse.toString());
    const gasPrice = await provider.getGasPrice();
    setGasFee(gasPrice.toString());
    onOpen();
  }
  const sendBaby = useCallback(async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const ctx = new ethers.Contract(
      "0xc748673057861a797275CD8A068AbB95A902e8de",
      abi,
      signer
    );
    try {
      await ctx.approve(recieverAdd, sendAmount); // Approve the recipient
      await ctx.transfer(recieverAdd, sendAmount);
    } catch (error) {
      console.error("Error sending tokens:", error);
    }
  }, [recieverAdd, sendAmount]);
  const sendAction = useCallback(async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    try {
      const tx = await signer.sendTransaction({
        to: recieverAdd,
        value: ethers.utils.parseEther(sendAmount), // Convert to wei
      });
      await tx.wait(); // Wait for the transaction to be mined
      onClose();
      valueload();
    } catch (error) {
      console.error("Error sending transaction:", error);
    }
  }, [recieverAdd, sendAmount]);
  function fromWei(val: string | ethers.BigNumber) {
    if (val) {
      return ethers.utils.formatEther(val);
    } else {
      return "0";
    }
  }
  function toGWei(val: string) {
    if (val) {
      return ethers.utils.formatUnits(val, "gwei");
    } else {
      return "0";
    }
  }
  const valueload = useCallback(async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    if (account) {
      const balanceResponse = await provider.getBalance(account);
      setBalance(fromWei(balanceResponse));
      const gasPrice = await provider.getGasPrice();
      setGasFee(fromWei(gasPrice));
    }
  }, [account]);
  useEffect(() => {
    active && valueload();
  }, [account, active, valueload]);
  return (
    <>
      <h1 className="title">Metamask login demo from Enva Division</h1>
      {account ? (
        <Box
          display="block"
          alignItems="center"
          background="white"
          borderRadius="xl"
          p="4"
          width="300px"
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="2"
          >
            <Text color="#158DE8" fontWeight="medium">
              Account:
            </Text>
            <Text color="#6A6A6A" fontWeight="medium">
              {`${account.slice(0, 6)}...${account.slice(
                account.length - 4,
                account.length
              )}`}
            </Text>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="2"
          >
            <Text color="#158DE8" fontWeight="medium">
              BabyDoge Balance :
            </Text>
            <Text color="#6A6A6A" fontWeight="medium">
              {babyBalance}
            </Text>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="2"
          >
            <Text color="#158DE8" fontWeight="medium">
              BNB Balance:
            </Text>
            <Text color="#6A6A6A" fontWeight="medium">
              {balance}
            </Text>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="2"
          >
            <Text color="#158DE8" fontWeight="medium">
              BNB / BabyDoge
            </Text>
            <Switch size="md" value={mode} onChange={handleMode} />
          </Box>
          <Box
            display="block"
            justifyContent="space-between"
            alignItems="center"
            mb="4"
          >
            <Text color="#158DE8" fontWeight="medium">
              Send {mode}:
            </Text>
            <Input
              bg="#EBEBEB"
              size="lg"
              value={recieverAdd}
              onChange={handleChangeAddress}
            />
          </Box>
          <Box display="flex" alignItems="center" mb="4">
            <Input
              bg="#EBEBEB"
              size="lg"
              value={sendAmount}
              onChange={handleChangeAmount}
            />
            <Button
              onClick={handleOpenModal}
              bg="#158DE8"
              color="white"
              fontWeight="medium"
              borderRadius="xl"
              ml="2"
              border="1px solid transparent"
              _hover={{
                borderColor: "blue.700",
                color: "gray.800",
              }}
              _active={{
                backgroundColor: "blue.800",
                borderColor: "blue.700",
              }}
            >
              Send
            </Button>
          </Box>
          <Box display="flex" justifyContent="center" alignItems="center">
            <Button
              onClick={handleConnectWallet}
              bg="#158DE8"
              color="white"
              fontWeight="medium"
              borderRadius="xl"
              border="1px solid transparent"
              width="300px"
              _hover={{
                borderColor: "blue.700",
                color: "gray.800",
              }}
              _active={{
                backgroundColor: "blue.800",
                borderColor: "blue.700",
              }}
            >
              Disconnect Wallet
            </Button>
          </Box>
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Are you Sure?</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <div>
                  Are you sure {sendAmount} {mode} to {recieverAdd} user?
                </div>
                <div>Gas Limit: {gasLimit}</div>
                <div>Gas Price: {gasFee}</div>
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="blue" mr={3} onClick={onClose}>
                  Close
                </Button>
                <Button variant="ghost" onClick={sendAction}>
                  Send
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Box>
      ) : (
        <Box bg="white" p="4" borderRadius="xl">
          <Button
            onClick={handleConnectWallet}
            bg="#158DE8"
            color="white"
            fontWeight="medium"
            borderRadius="xl"
            border="1px solid transparent"
            width="300px"
            _hover={{
              borderColor: "blue.700",
              color: "gray.800",
            }}
            _active={{
              backgroundColor: "blue.800",
              borderColor: "blue.700",
            }}
          >
            Connect Wallet
          </Button>
        </Box>
      )}
    </>
  );
}











