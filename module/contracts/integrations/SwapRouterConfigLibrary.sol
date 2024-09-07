// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

library SwapRouterConfigLibrary {
    struct RouterConfig {
        address payable routerAddress;
        uint24 fee;
    }

    // Define configurations inside a pure function
    function getSwapRouterConfig(uint256 chainId) internal pure returns (RouterConfig memory) {
        if (chainId == 1) { // Ethereum Mainnet
            return RouterConfig(payable(0xE592427A0AEce92De3Edee1F18E0157C05861564), 3000);
        } else if (chainId == 137) { // Polygon
            return RouterConfig(payable(0xE592427A0AEce92De3Edee1F18E0157C05861564), 3000);
        } else if (chainId == 42161) { // Arbitrum
            return RouterConfig(payable(0xE592427A0AEce92De3Edee1F18E0157C05861564), 500);
        } else {
            revert("Unsupported network");
        }
    }
}