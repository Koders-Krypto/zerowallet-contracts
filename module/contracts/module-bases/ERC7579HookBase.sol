// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import { IERC7579Hook } from "../safe7579/external/ERC7579.sol";
import { ERC7579ModuleBase } from "./ERC7579ModuleBase.sol";

abstract contract ERC7579HookBase is IERC7579Hook, ERC7579ModuleBase { }