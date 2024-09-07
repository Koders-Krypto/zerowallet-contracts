// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./SwapRouterConfigLibrary.sol";
import { ISwapRouter } from "./ISwapRouter.sol";
import { IERC20 } from "forge-std/interfaces/IERC20.sol";
import { ERC20Integration } from "modulekit/Integrations.sol";
import { Execution } from "modulekit/Accounts.sol";

/// @author zeroknots
library UniswapV3Integration {
    using ERC20Integration for IERC20;
    using SwapRouterConfigLibrary for uint256;


    function approveAndSwap(
        address smartAccount,
        IERC20 tokenIn,
        IERC20 tokenOut,
        uint256 amountIn,
        uint160 sqrtPriceLimitX96
    )
        internal
        view
        returns (Execution[] memory exec)
    {
        SwapRouterConfigLibrary.RouterConfig memory config = block.chainid.getSwapRouterConfig();

        exec = new Execution[](3);
        (exec[0], exec[1]) = ERC20Integration.safeApprove(tokenIn, config.routerAddress, amountIn);
        exec[2] = swapExactInputSingle(smartAccount, tokenIn, tokenOut, amountIn, sqrtPriceLimitX96, config.routerAddress, config.fee);
    }

    function swapExactInputSingle(
        address smartAccount,
        IERC20 tokenIn,
        IERC20 tokenOut,
        uint256 amountIn,
        uint160 sqrtPriceLimitX96,
        address payable swapRouter,
        uint24 fee
    )
        internal
        view
        returns (Execution memory exec)
    {
        exec = Execution({
            target: swapRouter,
            value: 0,
            callData: abi.encodeCall(
                ISwapRouter.exactInputSingle,
                (
                    ISwapRouter.ExactInputSingleParams({
                        tokenIn: address(tokenIn),
                        tokenOut: address(tokenOut),
                        fee: fee,
                        recipient: smartAccount,
                        deadline: block.timestamp,
                        amountIn: amountIn,
                        amountOutMinimum: 0,
                        sqrtPriceLimitX96: sqrtPriceLimitX96
                    })
                )
            )
        });
    }

    function swapExactOutputSingle(
        address smartAccount,
        IERC20 tokenIn,
        IERC20 tokenOut,
        uint256 amountOut,
        uint256 amountInMaximum,
        address payable swapRouter,
        uint24 fee
    )
        internal
        view
        returns (Execution memory exec)
    {
        exec = Execution({
            target: swapRouter,
            value: 0,
            callData: abi.encodeCall(
                ISwapRouter.exactOutputSingle,
                (
                    ISwapRouter.ExactOutputSingleParams({
                        tokenIn: address(tokenIn),
                        tokenOut: address(tokenOut),
                        fee: fee,
                        recipient: smartAccount,
                        deadline: block.timestamp,
                        amountOut: amountOut,
                        amountInMaximum: amountInMaximum,
                        sqrtPriceLimitX96: 0
                    })
                )
            )
        });
    }
}